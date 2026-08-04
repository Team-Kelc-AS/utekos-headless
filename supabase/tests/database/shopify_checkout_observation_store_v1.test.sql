begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(19);

select extensions.has_table(
  'ops',
  'shopify_checkout_observations',
  'creates the isolated Shopify checkout observation table'
);

select extensions.ok(
  not exists (
    select 1
    from pg_constraint
    where conrelid = 'ops.shopify_checkout_observations'::regclass
      and contype = 'f'
  ),
  'has no foreign keys into canonical or provider tables'
);

select extensions.ok(
  (
    select relrowsecurity and relforcerowsecurity
    from pg_class
    where oid = 'ops.shopify_checkout_observations'::regclass
  ),
  'enables and forces row level security'
);

select extensions.ok(
  not has_table_privilege(
    'anon',
    'ops.shopify_checkout_observations',
    'select'
  ),
  'denies anon reads'
);

select extensions.ok(
  not has_table_privilege(
    'authenticated',
    'ops.shopify_checkout_observations',
    'select'
  ),
  'denies authenticated reads'
);

select extensions.ok(
  has_table_privilege(
    'service_role',
    'ops.shopify_checkout_observations',
    'select, insert, update'
  )
  and not has_table_privilege(
    'service_role',
    'ops.shopify_checkout_observations',
    'delete'
  ),
  'grants service_role only the required table operations'
);

select extensions.ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'ops'
      and table_name = 'shopify_checkout_observations'
      and column_name = any (
        array[
          'raw_payload',
          'payload',
          'name',
          'email',
          'phone',
          'address',
          'url',
          'query_string',
          'referrer',
          'user_agent',
          'cookie',
          'click_id',
          'client_id',
          'line_items',
          'payment_method',
          'gateway',
          'alert_message'
        ]
      )
  ),
  'stores no raw payload or PII-capable convenience columns'
);

select extensions.ok(
  exists (
    select 1
    from cron.job
    where jobname = 'purge_expired_shopify_checkout_observations'
      and schedule = '47 3 * * *'
  ),
  'schedules the thirty-day retention purge'
);

select extensions.lives_ok(
  $sql$
    insert into ops.shopify_checkout_observations (
      idempotency_key,
      payload_sha256,
      event_name,
      event_id,
      event_sequence,
      occurred_at,
      analytics_processing_allowed,
      marketing_allowed,
      preferences_processing_allowed,
      sale_of_data_allowed,
      checkout_token,
      currency_code,
      commerce_value,
      item_quantity
    ) values (
      'utekos.shopify.checkout_observation:1:shopify_app_web_pixel:checkout_shipping_info_submitted:evt-shipping-1',
      repeat('a', 64),
      'checkout_shipping_info_submitted',
      'evt-shipping-1',
      1,
      '2026-08-03T18:00:00Z',
      true,
      false,
      false,
      false,
      'checkout-token-1',
      'NOK',
      1299.00,
      1
    )
  $sql$,
  'accepts a minimized, PII-free shipping observation'
);

select extensions.is(
  (
    select observation_count
    from ops.shopify_checkout_observations
    where event_id = 'evt-shipping-1'
  ),
  1,
  'stores the first observation once'
);

select extensions.lives_ok(
  $sql$
    insert into ops.shopify_checkout_observations (
      idempotency_key,
      payload_sha256,
      schema_version,
      event_name,
      event_id,
      event_sequence,
      occurred_at,
      analytics_processing_allowed,
      marketing_allowed,
      preferences_processing_allowed,
      sale_of_data_allowed,
      checkout_token,
      currency_code,
      commerce_value,
      item_quantity
    ) values (
      'utekos.shopify.checkout_observation:2:shopify_app_web_pixel:payment_info_submitted:evt-payment-v2',
      repeat('f', 64),
      2,
      'payment_info_submitted',
      'evt-payment-v2',
      2,
      '2026-08-03T18:00:30Z',
      true,
      false,
      false,
      false,
      'checkout-token-v2',
      'NOK',
      1299.00,
      1
    )
  $sql$,
  'accepts a strictly validated version 2 payment observation'
);

select extensions.throws_ok(
  $sql$
    insert into ops.shopify_checkout_observations (
      idempotency_key,
      payload_sha256,
      schema_version,
      event_name,
      event_id,
      event_sequence,
      occurred_at,
      analytics_processing_allowed,
      marketing_allowed,
      preferences_processing_allowed,
      sale_of_data_allowed,
      checkout_token,
      item_quantity
    ) values (
      'utekos.shopify.checkout_observation:3:shopify_app_web_pixel:payment_info_submitted:evt-payment-v3',
      repeat('e', 64),
      3,
      'payment_info_submitted',
      'evt-payment-v3',
      3,
      '2026-08-03T18:00:45Z',
      true,
      false,
      false,
      false,
      'checkout-token-v3',
      1
    )
  $sql$,
  '23514'::char(5),
  'new row for relation "shopify_checkout_observations" violates check constraint "shopify_checkout_observations_schema_version_check"',
  'rejects unsupported observation contract versions'
);

select extensions.lives_ok(
  $sql$
    update ops.shopify_checkout_observations
    set observation_count = observation_count + 1,
        last_observed_at = last_observed_at + interval '1 second',
        updated_at = updated_at + interval '1 second'
    where event_id = 'evt-shipping-1'
      and payload_sha256 = repeat('a', 64)
  $sql$,
  'allows monotonic bookkeeping for an identical replay'
);

select extensions.is(
  (
    select observation_count
    from ops.shopify_checkout_observations
    where event_id = 'evt-shipping-1'
  ),
  2,
  'increments an identical replay exactly once'
);

select extensions.throws_ok(
  $sql$
    update ops.shopify_checkout_observations
    set payload_sha256 = repeat('b', 64),
        observation_count = observation_count + 1,
        last_observed_at = last_observed_at + interval '1 second',
        updated_at = updated_at + interval '1 second'
    where event_id = 'evt-shipping-1'
  $sql$,
  '23514',
  'Shopify checkout observation identity and payload are immutable',
  'refuses to overwrite the first payload hash'
);

select extensions.throws_ok(
  $sql$
    insert into ops.shopify_checkout_observations (
      idempotency_key,
      payload_sha256,
      event_name,
      event_id,
      event_sequence,
      occurred_at,
      analytics_processing_allowed,
      marketing_allowed,
      preferences_processing_allowed,
      sale_of_data_allowed,
      checkout_token,
      item_quantity
    ) values (
      'invalid-key',
      repeat('c', 64),
      'payment_info_submitted',
      'evt-invalid-key',
      2,
      '2026-08-03T18:01:00Z',
      true,
      false,
      false,
      false,
      'checkout-token-2',
      1
    )
  $sql$,
  '23514'::char(5),
  'new row for relation "shopify_checkout_observations" violates check constraint "shopify_checkout_observations_idempotency_key_check"',
  'rejects an idempotency key that does not match the versioned identity'
);

select extensions.throws_ok(
  $sql$
    insert into ops.shopify_checkout_observations (
      idempotency_key,
      payload_sha256,
      event_name,
      event_id,
      event_sequence,
      occurred_at,
      analytics_processing_allowed,
      marketing_allowed,
      preferences_processing_allowed,
      sale_of_data_allowed,
      checkout_token,
      alert_type
    ) values (
      'utekos.shopify.checkout_observation:1:shopify_app_web_pixel:alert_displayed:evt-invalid-alert',
      repeat('d', 64),
      'alert_displayed',
      'evt-invalid-alert',
      3,
      '2026-08-03T18:02:00Z',
      true,
      false,
      false,
      false,
      'forbidden-checkout-token',
      'PAYMENT_ERROR'
    )
  $sql$,
  '23514'::char(5),
  'new row for relation "shopify_checkout_observations" violates check constraint "shopify_checkout_observations_shape_check"',
  'rejects an alert observation containing checkout commerce data'
);

select extensions.throws_ok(
  $sql$
    insert into ops.shopify_checkout_observations (
      idempotency_key,
      payload_sha256,
      verification_status,
      event_name,
      event_id,
      event_sequence,
      occurred_at,
      analytics_processing_allowed,
      marketing_allowed,
      preferences_processing_allowed,
      sale_of_data_allowed,
      checkout_token,
      item_quantity
    ) values (
      'utekos.shopify.checkout_observation:1:shopify_app_web_pixel:payment_info_submitted:evt-canonical',
      repeat('e', 64),
      'canonical',
      'payment_info_submitted',
      'evt-canonical',
      4,
      '2026-08-03T18:03:00Z',
      true,
      false,
      false,
      false,
      'checkout-token-3',
      1
    )
  $sql$,
  '23514'::char(5),
  'new row for relation "shopify_checkout_observations" violates check constraint "shopify_checkout_observations_verification_status_check"',
  'rejects canonical status claims'
);

select extensions.throws_ok(
  $sql$
    insert into ops.shopify_checkout_observations (
      idempotency_key,
      payload_sha256,
      event_name,
      event_id,
      event_sequence,
      occurred_at,
      analytics_processing_allowed,
      marketing_allowed,
      preferences_processing_allowed,
      sale_of_data_allowed,
      checkout_token,
      currency_code,
      commerce_value,
      item_quantity
    ) values (
      'utekos.shopify.checkout_observation:1:shopify_app_web_pixel:checkout_shipping_info_submitted:evt-shipping-1',
      repeat('f', 64),
      'checkout_shipping_info_submitted',
      'evt-shipping-1',
      1,
      '2026-08-03T18:00:00Z',
      true,
      false,
      false,
      false,
      'checkout-token-1',
      'NOK',
      1299.00,
      1
    )
  $sql$,
  '23505'::char(5),
  'duplicate key value violates unique constraint "shopify_checkout_observations_idempotency_key_key"',
  'rejects the same idempotency identity with a conflicting payload hash'
);

select * from extensions.finish();

rollback;
