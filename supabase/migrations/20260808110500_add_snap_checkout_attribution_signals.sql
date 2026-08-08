alter table marketing.checkout_attribution_snapshots
  add column if not exists sc_click_id text,
  add column if not exists sc_cookie1 text;

comment on column marketing.checkout_attribution_snapshots.sc_click_id is
  'Consent-gated Snap Click ID captured from the exact ScCid landing parameter; stored unchanged.';

comment on column marketing.checkout_attribution_snapshots.sc_cookie1 is
  'Consent-gated Snap first-party _scid cookie value for later CAPI matching; stored unchanged.';
