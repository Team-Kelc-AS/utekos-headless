# Abandoned checkout recovery v2 runbook

## Contract

- Supabase owns +1, +7 and +24 hour scheduling, leases, retries and durable deduplication.
- Shopify is re-read before every send for consent, recovery, orders, draft orders, newer checkout, inventory, native-email state and active STAYCOMFY configuration.
- Resend owns direct delivery and signed lifecycle webhooks. Managed Automations are not the scheduler.
- The Shopify `abandonedCheckoutUrl` is passed through unchanged.
- Only checkouts created at or after `ABANDONED_CHECKOUT_RECOVERY_ACTIVATED_AT` are eligible.
- Generic carts never receive STAYCOMFY copy. Eligible Comfyrobe carts receive “200 kr rabatt per Comfyrobe + gratis frakt”.
- GET `/avmelding` is confirmation only. POST `/api/email/unsubscribe` updates Shopify to `UNSUBSCRIBED` and suppresses remaining steps.

## Local gates

Run the no-send design sequence before any provider activation:

```bash
pnpm email:recovery:preview
```

This renders the three design frames at 0, 15 and 30 seconds in both generic
and STAYCOMFY variants. It writes only local HTML artifacts, has no delivery
dependency and cannot call Resend or mutate recovery dispatch state.
Production timing remains +1, +7 and +24 hours.

```bash
source "$HOME/.nvm/nvm.sh" && nvm use --silent
corepack pnpm exec tsx --test src/lib/email/abandonedCheckoutRecovery/*.test.ts src/components/emails/*.test.tsx src/app/api/webhooks/resend/route.test.ts
corepack pnpm exec next typegen
corepack pnpm exec tsc --noEmit
corepack pnpm build
npm run mcp:build
npm run mcp:doctor
```

Run the local Supabase reset and database lint before any linked migration. Do not use `supabase db push` without the separate production-schema approval.

## Provider gates

The following remain separate explicit approvals:

1. Apply the production migration.
2. Deploy the disabled app and set secrets.
3. Create/enable the Resend webhook.
4. Disable Shopify native abandoned-checkout email.
5. Set the activation timestamp and enable the cron.

Never log raw e-mail, recovery URL, webhook payload, unsubscribe token or provider payload. A Resend email ID proves provider acceptance only. Delivery requires a verified `email.delivered` webhook event.

## Official documentation

- [Shopify Discount Function API](https://shopify.dev/docs/api/functions/latest/discount)
- [Shopify AbandonedCheckout](https://shopify.dev/docs/api/admin-graphql/latest/objects/AbandonedCheckout)
- [Shopify customerEmailMarketingConsentUpdate](https://shopify.dev/docs/api/admin-graphql/latest/mutations/customerEmailMarketingConsentUpdate)
- [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Resend webhook verification](https://resend.com/docs/webhooks/verify-webhooks-requests)
- [Vercel Cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Markedsføringsloven § 15](https://lovdata.no/lov/2009-01-09-2/%C2%A715)
