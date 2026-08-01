-- Row Level Security: deny-by-default posture.
--
-- These tables live in the `marketing`, `partner` and `ops` schemas, which are
-- NOT exposed via the Data API (see api.schemas in config.toml). They are written
-- and read exclusively server-side using the `service_role` key, which bypasses RLS.
--
-- Enabling RLS with NO policies is intentional: `anon` and `authenticated` get zero
-- access (defense-in-depth), while backend access via service_role keeps working.
-- Do NOT add anon/authenticated policies here unless a table is deliberately exposed
-- to the client; that would weaken the security model.

alter table marketing.leads enable row level security;
alter table marketing.attribution_events enable row level security;
alter table marketing.website_visitor_events enable row level security;
alter table marketing.consent_snapshots enable row level security;
alter table marketing.event_ledger enable row level security;
alter table marketing.canonical_event_source_evidence enable row level security;
alter table marketing.canonical_event_source_evidence force row level security;
alter table marketing.meta_quality_snapshots enable row level security;
alter table marketing.campaign_insights enable row level security;
alter table marketing.meta_ad_delivery_insights enable row level security;
alter table marketing.checkout_attribution_snapshots enable row level security;
alter table marketing.checkout_attribution_lookup_tokens enable row level security;

alter table commerce.shopify_graphql_requests enable row level security;
alter table commerce.shopify_order_snapshots enable row level security;
alter table commerce.shopify_order_line_items enable row level security;

alter table partner.sources enable row level security;
alter table partner.referrals enable row level security;

alter table ops.integration_events enable row level security;
alter table ops.provider_dispatch_attempts enable row level security;
alter table ops.slo_incidents enable row level security;
alter table ops.dead_letter_events enable row level security;

alter table analytics.event_ledger_archive enable row level security;
alter table ops.web_vitals enable row level security;
alter table ops.integration_job_leases enable row level security;
alter table ops.vercel_edge_request_observations enable row level security;
alter table ops.vercel_edge_request_observations force row level security;
alter table ops.vercel_trace_observations enable row level security;
alter table ops.vercel_trace_observations force row level security;
alter table ops.landing_consent_observations enable row level security;
alter table ops.landing_consent_observations force row level security;

revoke all on table ops.vercel_edge_request_observations
  from public, anon, authenticated, service_role;
revoke all on table ops.vercel_trace_observations
  from public, anon, authenticated, service_role;
revoke all on table ops.landing_consent_observations
  from public, anon, authenticated, service_role;
revoke all on table ops.meta_landing_observability
  from public, anon, authenticated, service_role;
grant usage on schema ops to service_role;
grant select, insert on table ops.vercel_edge_request_observations to service_role;
grant select, insert, update on table ops.vercel_trace_observations to service_role;
grant select, insert, update on table ops.landing_consent_observations to service_role;
grant select on table ops.meta_landing_observability to service_role;
