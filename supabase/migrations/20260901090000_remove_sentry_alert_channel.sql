alter table ops.integration_alert_deliveries
  drop constraint if exists integration_alert_deliveries_channel_check;

alter table ops.integration_alert_deliveries
  add constraint integration_alert_deliveries_channel_check
  check (channel in ('codex', 'twilio_sms')) not valid;

comment on constraint integration_alert_deliveries_channel_check
  on ops.integration_alert_deliveries is
  'New alert deliveries are limited to active Utekos channels. Historical rows remain readable until a separate validation migration.';
