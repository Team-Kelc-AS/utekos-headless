set lock_timeout = '5s';

create index shopify_transactional_email_resend_events_idempotency_idx
  on ops.shopify_transactional_email_resend_events (idempotency_key);
