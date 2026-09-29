set lock_timeout = '5s';
set statement_timeout = '30s';

-- Expand the accepted contract versions before the application can emit v4.
-- NOT VALID avoids an immediate table scan while still enforcing the new
-- constraint for newly written rows. The existing narrower constraint remains
-- active until the replacement has been validated.
alter table ops.shopify_checkout_observations
  add constraint shopify_checkout_observations_schema_version_v4_check
  check (schema_version in (1, 2, 3, 4)) not valid;

alter table ops.shopify_checkout_observations
  validate constraint
    shopify_checkout_observations_schema_version_v4_check;


-- checkout_completed is already part of the application-level v3 contract,
-- but the production table currently rejects it at the event_name boundary.
-- Add it before enabling the new v4 purchase observation.
alter table ops.shopify_checkout_observations
  add constraint shopify_checkout_observations_event_name_v4_check
  check (
    event_name in (
      'checkout_shipping_info_submitted',
      'payment_info_submitted',
      'checkout_completed',
      'alert_displayed'
    )
  ) not valid;

alter table ops.shopify_checkout_observations
  validate constraint
    shopify_checkout_observations_event_name_v4_check;


-- Preserve the existing v1-v3 shapes and add two explicit completion shapes:
--
-- v3 checkout_completed:
--   Existing observed/reconciliation evidence. Commerce may remain minimized
--   according to the existing v3 contract.
--
-- v4 checkout_completed:
--   Purchase-delivery observation. Currency, value and at least one purchased
--   item are mandatory at the durable summary boundary.
--
-- Detailed v4 line items and order identity remain transient validated input.
-- This table deliberately stores only the minimized commerce summary plus the
-- payload fingerprint.
alter table ops.shopify_checkout_observations
  add constraint shopify_checkout_observations_shape_v4_check
  check (
    (
      event_name in (
        'checkout_shipping_info_submitted',
        'payment_info_submitted'
      )
      and schema_version in (1, 2, 3)
      and checkout_token is not null
      and item_quantity is not null
      and alert_type is null
      and (
        commerce_value is null
        or currency_code is not null
      )
    )
    or (
      event_name = 'checkout_completed'
      and schema_version = 3
      and checkout_token is not null
      and item_quantity is not null
      and alert_type is null
      and (
        commerce_value is null
        or currency_code is not null
      )
    )
    or (
      event_name = 'checkout_completed'
      and schema_version = 4
      and checkout_token is not null
      and currency_code is not null
      and commerce_value is not null
      and item_quantity is not null
      and item_quantity between 1 and 1000000
      and alert_type is null
    )
    or (
      event_name = 'alert_displayed'
      and schema_version = 1
      and alert_type in (
        'CHECKOUT_ERROR',
        'CONTACT_ERROR',
        'DELIVERY_ERROR',
        'PAYMENT_ERROR'
      )
      and checkout_token is null
      and currency_code is null
      and commerce_value is null
      and item_quantity is null
    )
  ) not valid;

alter table ops.shopify_checkout_observations
  validate constraint
    shopify_checkout_observations_shape_v4_check;


-- Only remove the currently active constraints after every broader replacement
-- has successfully validated. If validation fails, the old production guards
-- remain intact.
alter table ops.shopify_checkout_observations
  drop constraint shopify_checkout_observations_schema_version_check;

alter table ops.shopify_checkout_observations
  rename constraint shopify_checkout_observations_schema_version_v4_check
  to shopify_checkout_observations_schema_version_check;


alter table ops.shopify_checkout_observations
  drop constraint shopify_checkout_observations_event_name_check;

alter table ops.shopify_checkout_observations
  rename constraint shopify_checkout_observations_event_name_v4_check
  to shopify_checkout_observations_event_name_check;


alter table ops.shopify_checkout_observations
  drop constraint shopify_checkout_observations_shape_check;

alter table ops.shopify_checkout_observations
  rename constraint shopify_checkout_observations_shape_v4_check
  to shopify_checkout_observations_shape_check;


comment on table ops.shopify_checkout_observations is
  'Thirty-day, PII-free Shopify Web Pixel checkout observations. Rows are public browser observations only: they are not canonical payment truth or provider-delivery evidence. Schema v4 checkout_completed stores only the minimized commerce summary; validated order identity and line-item detail remain transient receiver input and are not persisted in this table. Raw payloads, names, email, phone, addresses, URLs, query strings, cookies, click ids, client ids, user agents, line items, payment methods, gateways, alert text and provider data are forbidden from durable row storage.';
