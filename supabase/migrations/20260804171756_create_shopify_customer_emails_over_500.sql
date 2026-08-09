create table if not exists marketing.shopify_customer_emails_over_500 (
  email text primary key,
  constraint shopify_customer_emails_over_500_email_normalized_chk
    check (
      email = lower(btrim(email))
      and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
);

comment on table marketing.shopify_customer_emails_over_500 is
  'Deduplicated, normalized email-only list of Shopify customers whose lifetime amount spent is strictly greater than NOK 500.';

comment on column marketing.shopify_customer_emails_over_500.email is
  'Lowercase and trimmed Shopify customer email. This is the table''s only column.';

alter table marketing.shopify_customer_emails_over_500 enable row level security;

revoke all on table marketing.shopify_customer_emails_over_500 from anon, authenticated;;
