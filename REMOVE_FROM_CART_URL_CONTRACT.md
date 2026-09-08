# Remove-from-cart: observed page URL

Local change, not production deployment evidence. No live systems changed.

- Capture the page URL, title, page-view ID and referrer at the removal action,
  before the quantity debounce or asynchronous Shopify mutation.
- Emit only after Shopify confirms a removal. Read consent again at reporting
  time; a failed page-context capture must not block the cart mutation.
- The browser constructor requires URL/title and never substitutes the homepage.
- URL-less webhook events remain operational ledger events. Meta attempts are
  `skipped_unqualified` with `missing_page_url`; the mapper also rejects them
  defensively. Google omits the optional `page_location` parameter.
- No historic events are rewritten or replayed. No changes to Purchase,
  checkout attribution, Snapchat fallbacks, GTM or provider configuration.

Sources checked before implementation:

- [Meta request-context mapping](https://github.com/facebook/facebook-nodejs-business-sdk/blob/main/_autodocs/configuration.md)
- [Google Data Manager event fields](https://developers.google.com/data-manager/api/devguides/events/send-events)

Regression coverage: `removeFromCartPageContext.test.ts` and
`server/removeFromCartUrlContract.test.ts`, plus existing removal, webhook,
dispatch-planning and persistence suites. A production readback is still required
after a separately approved release.
