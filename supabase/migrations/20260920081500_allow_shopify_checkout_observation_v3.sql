set lock_timeout = '5s';
set statement_timeout = '30s';

alter table ops.shopify_checkout_observations
  add constraint shopify_checkout_observations_schema_version_v3_check
  check (schema_version in (1, 2, 3)) not valid;

alter table ops.shopify_checkout_observations
  validate constraint shopify_checkout_observations_schema_version_v3_check;

alter table ops.shopify_checkout_observations
  drop constraint shopify_checkout_observations_schema_version_check;

alter table ops.shopify_checkout_observations
  rename constraint shopify_checkout_observations_schema_version_v3_check
  to shopify_checkout_observations_schema_version_check;
