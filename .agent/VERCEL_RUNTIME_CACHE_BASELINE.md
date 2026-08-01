# Vercel Runtime Cache baseline

Status date: 2026-07-15

This is the pre-release comparison point for the Shopify catalog Runtime
Cache release. The values were captured from Vercel Observability before
the release branch was created.

| Surface | Baseline |
| --- | --- |
| `/skreddersy-varmen` | 8,788 requests, 14% cache hit rate, approximately 501 ms p95 |
| `/index` | 7,713 ISR writes and 5 reads |
| `/api/search-index` | 6 function invocations |
| `/produkter/utekos-techdown` | 1,085 revalidations and 617 writes |
| `/produkter/utekos-mikrofiber` | 950 revalidations and 350 writes |
| `/produkter/utekos-dun` | 799 revalidations and 338 writes |
| `/produkter/comfyrobe` | 780 revalidations and 249 writes |
| `/produkter` | 733 revalidations and 80 writes |

## Follow-up windows

At 7 and 14 complete days after production release, compare the same
surfaces and time-of-day boundaries for:

- Runtime Cache hit rate and item size.
- Shopify Storefront API calls by product handle.
- Function duration and cold starts for product and landing routes.
- ISR reads, writes and revalidations.
- `/api/search-index` function invocations and CDN `HIT` responses.

The release is successful when catalog freshness remains webhook-driven,
invalid cache values are absent, and Shopify calls and avoidable ISR writes
fall without increasing p95 duration or storefront errors.
