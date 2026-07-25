# AI Commerce recommendations resource manifest

Status date: 2026-07-25

## Verified production state

The Shopify catalog is imported into Google Cloud Retail in project
`741353863697`:

- Catalog: `projects/741353863697/locations/global/catalogs/default_catalog`
- Branch: `projects/741353863697/locations/global/catalogs/default_catalog/branches/default_branch`
- Primary Shopify products: 5
- Shopify variants: 14
- Retail product records: 19
- Import operation:
  `projects/741353863697/locations/global/catalogs/default_catalog/branches/0/operations/import-products-16545362042580209848`
- Import result: 19 successes, 0 failures, no error samples

An independent REST readback returned 19 records: five IDs prefixed with
`shopify-product-` and fourteen IDs prefixed with `shopify-variant-`. Every
record in the branch is owned by this import.

The pre-existing `recently_viewed` model and its
`recently_viewed_default` serving config remain unchanged. The default search
serving config also remains unchanged.

## Similar Items gate

Google documents a minimum of 100 product SKUs in a branch before a Similar
Items model can be created. The live Shopify catalog currently contains 14
real variants. The desired model and serving config are therefore deliberately
not created:

- Desired model ID: `utekos-similar-items-v1`
- Desired model type: `similar-items`
- Desired serving config ID: `utekos-similar-items-v1`
- Current model status: `blocked_minimum_variants` (14 of 100)

No synthetic products, variants, user events, orders, or inventory values may
be introduced to satisfy this threshold. Re-run the catalog plan after Shopify
contains at least 100 real variants. The apply tool creates at most one Similar
Items model and waits for it to become `ACTIVE` before it can create the
recommendation serving config.

Do not enable a storefront prediction adapter until the model is active, the
serving config exists, and recommendation responses have passed preview and
production runtime verification.

## Apply controls

Catalog import requires both:

- `--apply-catalog`
- `ASSISTANT_GCP_RETAIL_CATALOG_APPROVAL=approved-utekos-retail-v1`

Eligible model or serving-config creation additionally requires both:

- `--apply-model`
- `ASSISTANT_GCP_RETAIL_MODEL_APPROVAL=approved-utekos-similar-items-v1`

The access token is ephemeral and must be supplied through
`GCP_RETAIL_ACCESS_TOKEN`. It must never be logged or committed. The catalog
import uses `INCREMENTAL` reconciliation and verifies every expected stable
Shopify-derived ID after the long-running operation completes.

## Official documentation

- [Recommendation model types and requirements](https://docs.cloud.google.com/retail/docs/models)
- [Create recommendation models](https://docs.cloud.google.com/retail/docs/create-models)
- [Create serving configurations](https://docs.cloud.google.com/retail/docs/create-configs)
- [Import products](https://docs.cloud.google.com/retail/docs/reference/rest/v2/projects.locations.catalogs.branches.products/import)
- [Retail Product schema](https://docs.cloud.google.com/retail/docs/reference/rest/v2/projects.locations.catalogs.branches.products)
- [Shopify Storefront products query](https://shopify.dev/docs/api/storefront/latest/queries/products)
