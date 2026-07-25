# GCP Discovery resource manifest

Last reviewed: 2026-07-25

This manifest defines the dedicated Discovery Engine resources for the Utekos customer assistant. It is a desired-state record, not proof that the resources exist in Google Cloud.

## Dedicated resources

- Project: `project-c683eb2c-20ae-4ec2-ac3`
- Location: `global`
- Collection: `projects/project-c683eb2c-20ae-4ec2-ac3/locations/global/collections/default_collection`
- Data store: `projects/project-c683eb2c-20ae-4ec2-ac3/locations/global/collections/default_collection/dataStores/utekos-customer-support-v1`
- Default branch: `projects/project-c683eb2c-20ae-4ec2-ac3/locations/global/collections/default_collection/dataStores/utekos-customer-support-v1/branches/default_branch`
- Engine: `projects/project-c683eb2c-20ae-4ec2-ac3/locations/global/collections/default_collection/engines/utekos-customer-assistant-v1`
- Serving config: `projects/project-c683eb2c-20ae-4ec2-ac3/locations/global/collections/default_collection/engines/utekos-customer-assistant-v1/servingConfigs/default_serving_config`

The data store uses `GENERIC`, `SOLUTION_TYPE_SEARCH`, and `CONTENT_REQUIRED`. The engine uses `GENERIC`, `SOLUTION_TYPE_SEARCH`, enterprise search tier `SEARCH_TIER_ENTERPRISE`, add-on `SEARCH_ADD_ON_LLM`, and only data store ID `utekos-customer-support-v1`.

## Reviewed document set

Each document is imported with its stable ID, exact canonical Utekos URI, UTF-8 `text/plain` raw content, and the checksum below. Inline import is incremental only; this workflow does not claim or perform full reconciliation.

| Document ID | SHA-256 checksum |
| --- | --- |
| `compare-models` | `74f2718c9c54dcbf8e9158ac4092ce8c7f283671bdea09fdf0d2b553d393fc5f` |
| `comfyrobe-faq` | `17656be159f972d787b5071662686827a7d615db77cae5fe6885e02976aab6e9` |
| `shipping-returns` | `24d9347559a43bc1c72a119ca8a33b6b97e5325b850c54deacc4b6ccd27abf11` |
| `size-guide` | `8a640a78959669c66e33722f0c8356b8f6e7c292590c10e0efc18ae42c2778e4` |
| `materials` | `c8ed6a5e8df225f2d61b4918fc884285a5432bd7f274c8a78859b54937f2d377` |
| `care` | `0ba6f5c2ef884175eb33d83cbb414ab8607b6c8c8c7bc999cd64b577edebca23` |
| `contact` | `d7b91931af4221198d174d22cd3877b199794dd7457af0f347dc568cf6231d92` |

The corpus contains no customer, order, exact inventory quantity, secret, or credential data.

## Safety and approval boundary

The planning command is read-only. It reports dedicated resources as `create`, `noop`, or `drift/manual_review`, lists unrelated resources separately, and reports unexpected document IDs without deleting them.

The apply command requires both the `--apply` argument and `ASSISTANT_GCP_APPLY_APPROVAL=approved-utekos-assistant-v1` before it constructs a Google client or reads authentication. A separate, explicit approval is required before anyone supplies those gates. The apply path may create only the absent dedicated data store and engine and incrementally import the seven reviewed documents. It refuses conflicting dedicated-resource drift and never updates, deletes, or purges unrelated resources or unexpected documents. Every long-running operation is awaited before proceeding.

## Rollback and billing

After separate authorization, remove or disable `GCP_DISCOVERY_ENGINE_ID` in Vercel to return the customer assistant to static support. Deleting Google Cloud resources is destructive and requires its own separate approval.

The user's promotion is labelled **Trial credit for GenAI App Builder**. Exact SKU eligibility and net pricing remain governed by the promotion terms and the Google Cloud Billing report; local code does not prove that usage is credit-eligible or free.
