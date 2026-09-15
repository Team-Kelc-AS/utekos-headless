# OpenAI Ads product feed ownership

This directory owns the deterministic, UTF-8 full-snapshot
catalog export for OpenAI Ads. Shopify remains the source of
truth for product, variant, price, availability and media data.
The public artifact is
`https://utekos.no/openai-ads-products.csv` after a separately
approved release.

The application repository owns:

- Shopify input validation, curated Utekos presentation and
  variant mapping;
- stable product and variant identifiers;
- CSV schema, escaping, deterministic ordering and HTTP response
  behavior;
- focused tests and release verification for the feed artifact.

The application repository does not own:

- the OpenAI Ads account, feed object, `feed_id` or registered
  countries;
- SFTP host, username, password, SSH private key or upload
  history;
- Advertiser API credentials, uploads, diagnostics, product sets
  or campaigns;
- a recurring upload scheduler.

Those operational resources belong in the provider and the
ignored local operations/secrets layer owned by
`utekos-platform-tools` or an approved secret store. Never commit
them here. A successful HTTP response only proves generation of
an intermediate artifact; it does not prove SFTP upload,
ingestion, ads eligibility, product-set matching or delivery.

OpenAI currently documents full snapshots pushed to the feed's
SFTP root, a stable filename, UTF-8 encoding, asynchronous
processing and at least daily delivery. Background jobs are
prohibited by this repository's current operating rules, so
automation must remain unimplemented until separately authorized
and the prohibition is lifted. Manual delivery must be followed
by upload-history, accepted/rejected-row, ads-eligible-count and
product-query readback.

Authoritative references:

- https://developers.openai.com/ads/product-feeds
- https://developers.openai.com/commerce/specs/file-upload/products
- https://developers.openai.com/commerce/specs/file-upload/overview
- https://developers.openai.com/commerce/guides/best-practices
