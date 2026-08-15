import { eventCatalog } from '../../src/lib/analytics/eventCatalog'

export type ParameterRequirement =
  | 'required'
  | 'conditional'
  | 'recommended'
  | 'optional'

type Parameter = Readonly<{
  path: string
  requirement: ParameterRequirement
  source: string
  rule: string
}>

const parameter = (
  path: string,
  requirement: ParameterRequirement,
  source: string,
  rule: string
): Parameter => ({ path, requirement, source, rule })

const canonicalEnvelope = [
  parameter(
    'event_name',
    'required',
    'event producer',
    'Canonical catalog name.'
  ),
  parameter(
    'event_id',
    'required',
    'event producer',
    'UUID reused for retries and browser/server deduplication.'
  ),
  parameter(
    'event_time',
    'required',
    'event producer',
    'ISO 8601 occurrence timestamp; provider mappers convert it to their required representation.'
  ),
  parameter(
    'source',
    'required',
    'event producer',
    'One of web, server, or webhook as constrained by the event schema.'
  ),
  parameter(
    'environment',
    'required',
    'event producer',
    'Canonical runtime environment.'
  ),
  parameter(
    'schema_version',
    'required',
    'event producer',
    'Canonical schema version.'
  ),
  parameter(
    'consent.analytics',
    'required',
    'consent snapshot',
    'Controls analytics collection and export.'
  ),
  parameter(
    'consent.marketing',
    'required',
    'consent snapshot',
    'Controls advertising identifiers and marketing export.'
  ),
  parameter(
    'consent.preferences',
    'required',
    'consent snapshot',
    'Records preference-processing state.'
  ),
  parameter(
    'consent.source',
    'required',
    'consent snapshot',
    'Consent authority recorded with the event.'
  ),
  parameter(
    'consent.version',
    'required',
    'consent snapshot',
    'Consent configuration version.'
  ),
  parameter(
    'page_url',
    'conditional',
    'browser or request context',
    'Required by web schemas that declare page context; server normalization can enrich it.'
  ),
  parameter(
    'page_title',
    'conditional',
    'browser',
    'Required by event-specific web schemas.'
  ),
  parameter(
    'page_referrer',
    'optional',
    'browser or request context',
    'Forwarded only when present.'
  ),
  parameter(
    'page_view_id',
    'conditional',
    'browser',
    'Required by page-scoped schemas and used for correlation.'
  ),
  parameter(
    'external_id',
    'conditional',
    'first-party identity',
    'Provider use is consent-gated and normalized or hashed by the provider mapper.'
  ),
  parameter(
    'browser_id.*',
    'optional',
    'first-party cookies',
    'Contains provider/browser identifiers such as fbp, fbc, ga client ID, or UET anonymous ID.'
  ),
  parameter(
    'click_id.*',
    'optional',
    'landing URL or persisted attribution',
    'Contains gclid, gbraid, wbraid, dclid, msclkid, and fbclid when observed.'
  ),
  parameter(
    'client_ip_address',
    'optional',
    'trusted request context',
    'Never accepted as authoritative customer address data.'
  ),
  parameter(
    'event_device_info.*',
    'optional',
    'browser or request context',
    'User agent, language, screen, OS, device, and browser fields when observed.'
  ),
  parameter(
    'location.*',
    'optional',
    'trusted request context',
    'Coarse event location; not treated as customer-provided address PII.'
  ),
  parameter(
    'user_data.*',
    'optional',
    'consented first-party identity',
    'Provider-specific identifiers are emitted only under the required consent.'
  ),
  parameter(
    'custom_data.*',
    'conditional',
    'event producer',
    'Event-specific Zod schema is authoritative for business fields and commerce items.'
  )
] as const

const googleServer = [
  parameter(
    'eventName',
    'required',
    'event_name',
    'Required by Google Analytics destinations; canonical event name is preserved.'
  ),
  parameter(
    'eventTimestamp',
    'required',
    'event_time',
    'Converted to google.protobuf.Timestamp.'
  ),
  parameter(
    'eventSource',
    'required',
    'constant WEB',
    'Google Data Manager EventSource.WEB.'
  ),
  parameter(
    'transactionId',
    'required',
    'event_id or order transaction ID',
    'Canonical events use event_id; purchase/refund use the authoritative transaction ID.'
  ),
  parameter(
    'clientId',
    'conditional',
    'browser_id.google_client_id',
    'Required by current web-event mapper; purchase also permits an eligible click ID or user ID.'
  ),
  parameter(
    'userId',
    'conditional',
    'external_id',
    'Only with marketing consent.'
  ),
  parameter(
    'consent.adUserData',
    'required',
    'consent.marketing',
    'Mapped to granted or denied.'
  ),
  parameter(
    'consent.adPersonalization',
    'required',
    'consent.marketing',
    'Mapped to granted or denied.'
  ),
  parameter(
    'userData.userIdentifiers[].hashedEmail',
    'conditional',
    'user_data.email',
    'Normalized and SHA-256 hashed; marketing consent required.'
  ),
  parameter(
    'userData.userIdentifiers[].hashedPhoneNumber',
    'conditional',
    'user_data.phone',
    'Normalized and SHA-256 hashed; marketing consent required.'
  ),
  parameter(
    'adIdentifiers.gclid',
    'conditional',
    'click_id.gclid',
    'Marketing consent required.'
  ),
  parameter(
    'adIdentifiers.gbraid',
    'conditional',
    'click_id.gbraid',
    'Marketing consent required.'
  ),
  parameter(
    'adIdentifiers.wbraid',
    'conditional',
    'click_id.wbraid',
    'Marketing consent required.'
  ),
  parameter(
    'adIdentifiers.dclid',
    'conditional',
    'click_id.dclid',
    'Marketing consent required.'
  ),
  parameter(
    'adIdentifiers.impressionId',
    'conditional',
    'impression_id',
    'Marketing consent required.'
  ),
  parameter(
    'eventDeviceInfo.userAgent',
    'optional',
    'event_device_info.user_agent',
    'Forwarded when observed.'
  ),
  parameter(
    'eventDeviceInfo.ipAddress',
    'conditional',
    'client_ip_address',
    'Suppressed for Norway, EEA, United Kingdom, and Switzerland by the implementation.'
  ),
  parameter(
    'eventDeviceInfo.languageCode',
    'optional',
    'event_device_info.language',
    'Forwarded when observed.'
  ),
  parameter(
    'eventDeviceInfo.screenWidth',
    'optional',
    'event_device_info.screen_width',
    'Forwarded when observed.'
  ),
  parameter(
    'eventDeviceInfo.screenHeight',
    'optional',
    'event_device_info.screen_height',
    'Forwarded when observed.'
  ),
  parameter(
    'eventLocation.city',
    'optional',
    'location.city',
    'Coarse event location.'
  ),
  parameter(
    'eventLocation.regionCode',
    'optional',
    'location.region_code',
    'Coarse event location.'
  ),
  parameter(
    'eventLocation.countryCode',
    'optional',
    'location.country_code',
    'Coarse event location.'
  ),
  parameter(
    'currency',
    'conditional',
    'custom_data.currency',
    'Required for value-bearing commerce events.'
  ),
  parameter(
    'conversionValue',
    'conditional',
    'custom_data.value',
    'Mapped for value-bearing events.'
  ),
  parameter(
    'cartData.items[].itemId',
    'conditional',
    'custom_data.items[].item_id or variant_id',
    'Required for item-bearing commerce events.'
  ),
  parameter(
    'cartData.items[].quantity',
    'conditional',
    'custom_data.items[].quantity',
    'Positive item quantity.'
  ),
  parameter(
    'cartData.items[].unitPrice',
    'conditional',
    'custom_data.items[].unit_price',
    'Net unit price used by the current mapper.'
  ),
  parameter(
    'cartData.items[].additionalItemParameters',
    'optional',
    'custom_data.items[]',
    'Up to 24 mapped item fields including name, brand, variant, categories, IDs, SKU, GTIN, tax, gross price, inventory, and product type.'
  ),
  parameter(
    'additionalEventParameters.event_id',
    'required',
    'event_id',
    'Provider correlation and deduplication parameter.'
  ),
  parameter(
    'additionalEventParameters.page_view_id',
    'conditional',
    'page_view_id',
    'Page correlation when present.'
  ),
  parameter(
    'additionalEventParameters.page_location',
    'conditional',
    'page_url',
    'Current page URL when present.'
  ),
  parameter(
    'additionalEventParameters.page_title',
    'optional',
    'page_title',
    'Current page title when present.'
  ),
  parameter(
    'additionalEventParameters.page_referrer',
    'optional',
    'page_referrer',
    'Referrer when present.'
  ),
  parameter(
    'additionalEventParameters.session_id',
    'optional',
    'browser_id.ga_session_id',
    'GA session correlation when present.'
  ),
  parameter(
    'additionalEventParameters.<event field>',
    'conditional',
    'scalar custom_data fields',
    'Every supported scalar event field is copied; individual parameter values are capped at 100 characters.'
  )
] as const

const metaServer = [
  parameter(
    'event_name',
    'required',
    'provider event mapping',
    'Standard or custom Meta event name.'
  ),
  parameter(
    'event_time',
    'required',
    'event_time',
    'UTC epoch seconds; must remain within Meta ingestion limits.'
  ),
  parameter(
    'event_id',
    'recommended',
    'event_id',
    'Must match the browser Pixel eventID when both transports emit the same occurrence.'
  ),
  parameter(
    'action_source',
    'required',
    'constant website',
    'Required for website Conversions API events.'
  ),
  parameter(
    'event_source_url',
    'required',
    'page_url or request context',
    'Required for website events; capi-param-builder can fill it from trusted request context.'
  ),
  parameter(
    'referrer_url',
    'optional',
    'page_referrer or request context',
    'Filled only when present.'
  ),
  parameter(
    'user_data.client_user_agent',
    'required',
    'event_device_info.user_agent or request headers',
    'Required for website events.'
  ),
  parameter(
    'user_data.client_ip_address',
    'recommended',
    'trusted request context',
    'Forwarded unhashed; not used as customer address.'
  ),
  parameter(
    'user_data.fbp',
    'recommended',
    'browser_id.fbp or _fbp cookie',
    'Resolved by capi-param-builder when absent from canonical data.'
  ),
  parameter(
    'user_data.fbc',
    'conditional',
    'browser_id.fbc, _fbc cookie, or fbclid',
    'Resolved or constructed by capi-param-builder.'
  ),
  parameter(
    'user_data.em[]',
    'conditional',
    'user_data.email',
    'Normalized and SHA-256 hashed by the Meta SDK/user-data builder.'
  ),
  parameter(
    'user_data.ph[]',
    'conditional',
    'user_data.phone',
    'Normalized and SHA-256 hashed by the Meta SDK/user-data builder.'
  ),
  parameter(
    'user_data.external_id[]',
    'conditional',
    'external_id',
    'Normalized and SHA-256 hashed.'
  ),
  parameter(
    'user_data.ct[]',
    'optional',
    'customer-provided city',
    'Hashed customer address field; never populated from IP geolocation.'
  ),
  parameter(
    'user_data.st[]',
    'optional',
    'customer-provided state',
    'Hashed customer address field.'
  ),
  parameter(
    'user_data.zp[]',
    'optional',
    'customer-provided postal code',
    'Hashed customer address field.'
  ),
  parameter(
    'user_data.country[]',
    'optional',
    'customer-provided country',
    'Hashed customer address field.'
  ),
  parameter(
    'custom_data.currency',
    'conditional',
    'custom_data.currency',
    'Required for value-bearing commerce mappings.'
  ),
  parameter(
    'custom_data.value',
    'conditional',
    'custom_data.gross_value or value',
    'Gross value is used by the current commerce mapper.'
  ),
  parameter(
    'custom_data.content_ids[]',
    'conditional',
    'custom_data.items[].variant_id',
    'Shopify variant IDs normalized for Meta commerce matching.'
  ),
  parameter(
    'custom_data.contents[]',
    'conditional',
    'custom_data.items[]',
    'Maps id, quantity, item_price, title, brand, and category when present.'
  ),
  parameter(
    'custom_data.content_type',
    'conditional',
    'constant product',
    'Set for product commerce events.'
  ),
  parameter(
    'custom_data.num_items',
    'conditional',
    'custom_data.items[].quantity',
    'Sum of item quantities.'
  ),
  parameter(
    'custom_data.search_string',
    'conditional',
    'custom_data.search_term',
    'Search event mapping.'
  ),
  parameter(
    'custom_data.<event field>',
    'optional',
    'safe scalar custom_data fields',
    'Event-specific non-PII fields are copied by the registered mapper.'
  )
] as const

const metaBrowser = [
  parameter(
    'event name',
    'required',
    'provider event mapping',
    'Emitted with fbq trackSingle or trackSingleCustom.'
  ),
  parameter(
    'eventID',
    'required',
    'event_id',
    'Shared with server event_id for deduplication.'
  ),
  parameter(
    'content_ids',
    'conditional',
    'canonical_event.custom_data.items',
    'Commerce variant IDs.'
  ),
  parameter(
    'contents',
    'conditional',
    'canonical_event.custom_data.items',
    'Commerce id, quantity, and item price.'
  ),
  parameter(
    'content_type',
    'conditional',
    'constant product',
    'Product commerce events.'
  ),
  parameter(
    'num_items',
    'conditional',
    'canonical_event.custom_data.items',
    'Sum of quantities.'
  ),
  parameter(
    'currency',
    'conditional',
    'canonical_event.custom_data.currency',
    'Only with a valid value-bearing payload.'
  ),
  parameter(
    'value',
    'conditional',
    'canonical_event.custom_data.gross_value or value',
    'Only with a finite non-negative amount.'
  ),
  parameter(
    'search_string',
    'conditional',
    'canonical_event.custom_data.search_term',
    'Search event mapping.'
  ),
  parameter(
    '<event field>',
    'optional',
    'canonical_event.custom_data',
    'Allowlisted event-specific fields in the GTM Meta template.'
  )
] as const

const microsoftServer = [
  parameter(
    'data[].eventType',
    'required',
    'event mapping',
    'pageLoad for page_view; custom for commerce events.'
  ),
  parameter(
    'data[].eventTime',
    'required',
    'event_time',
    'UTC epoch milliseconds and no older than seven days.'
  ),
  parameter(
    'data[].eventId',
    'required',
    'event_id',
    'Shared with browser UET for deduplication.'
  ),
  parameter(
    'data[].eventName',
    'required',
    'provider event mapping',
    'Shared with browser UET for deduplication.'
  ),
  parameter(
    'data[].eventSourceUrl',
    'conditional',
    'page_url',
    'Required for pageLoad and supplied for custom events when available.'
  ),
  parameter(
    'data[].pageLoadId',
    'conditional',
    'page_view_id',
    'UUID that associates custom events with their page load.'
  ),
  parameter(
    'data[].referrerUrl',
    'optional',
    'page_referrer',
    'Forwarded when present.'
  ),
  parameter(
    'data[].pageTitle',
    'optional',
    'page_title',
    'Forwarded when present.'
  ),
  parameter(
    'data[].adStorageConsent',
    'required',
    'consent.marketing',
    'Current dispatch requires granted marketing consent and emits G.'
  ),
  parameter(
    'data[].userData',
    'required',
    'canonical identity and request context',
    'At least one supported identifier is required by the local Zod contract.'
  ),
  parameter(
    'data[].userData.anonymousId',
    'recommended',
    'browser_id.uet_anonymous_id',
    'Must match browser UET VID for ID sync and cross-transport attribution.'
  ),
  parameter(
    'data[].userData.msclkid',
    'recommended',
    'click_id.msclkid',
    'Preferred click identifier; retained only within the provider limit.'
  ),
  parameter(
    'data[].userData.externalId',
    'conditional',
    'external_id',
    'Normalized first-party identifier.'
  ),
  parameter(
    'data[].userData.em',
    'conditional',
    'user_data.email',
    'Normalized and SHA-256 hashed.'
  ),
  parameter(
    'data[].userData.ph',
    'conditional',
    'user_data.phone',
    'Normalized and SHA-256 hashed.'
  ),
  parameter(
    'data[].userData.clientIp',
    'recommended',
    'client_ip_address',
    'Trusted request context.'
  ),
  parameter(
    'data[].userData.clientUserAgent',
    'recommended',
    'event_device_info.user_agent',
    'Trusted request context.'
  ),
  parameter(
    'data[].customData.currency',
    'conditional',
    'custom_data.currency',
    'Commerce currency.'
  ),
  parameter(
    'data[].customData.value',
    'conditional',
    'custom_data.value',
    'Commerce value.'
  ),
  parameter(
    'data[].customData.transactionId',
    'conditional',
    'transaction ID',
    'Authoritative purchase transaction where applicable.'
  ),
  parameter(
    'data[].customData.items[]',
    'conditional',
    'custom_data.items[]',
    'Maps id, quantity, price, name.'
  ),
  parameter(
    'data[].customData.itemIds[]',
    'conditional',
    'custom_data.items[].variant_id or item_id',
    'Dynamic remarketing item identifiers.'
  ),
  parameter(
    'data[].customData.pageType',
    'conditional',
    'event mapping',
    'Dynamic remarketing page classification.'
  ),
  parameter(
    'data[].customData.ecommTotalValue',
    'conditional',
    'custom_data.value',
    'Dynamic remarketing value.'
  ),
  parameter(
    'continueOnValidationError',
    'required',
    'constant false',
    'Batch fails closed in the current implementation.'
  ),
  parameter(
    'dataProvider',
    'required',
    'constant utekos-headless',
    'Identifies the first-party sender.'
  )
] as const

const microsoftBrowser = [
  parameter(
    'event',
    'required',
    'provider event mapping',
    'Native UET event name.'
  ),
  parameter(
    'event_id',
    'required',
    'event_id',
    'Shared with server eventId for deduplication.'
  ),
  parameter(
    'event_category',
    'required',
    'constant ecommerce or event class',
    'GTM UET parameter.'
  ),
  parameter(
    'event_label',
    'required',
    'event_id',
    'Current GTM label correlation.'
  ),
  parameter(
    'event_value',
    'conditional',
    'canonical_event.custom_data.value',
    'Finite numeric event value.'
  ),
  parameter(
    'revenue_value',
    'conditional',
    'canonical_event.custom_data.value',
    'Revenue mapping for value-bearing events.'
  ),
  parameter(
    'currency',
    'conditional',
    'canonical_event.custom_data.currency',
    'Commerce currency.'
  ),
  parameter(
    'ecomm_pagetype',
    'conditional',
    'event mapping',
    'Dynamic remarketing page type.'
  ),
  parameter(
    'ecomm_totalvalue',
    'conditional',
    'canonical_event.custom_data.value',
    'Dynamic remarketing total.'
  ),
  parameter(
    'ecomm_prodid[]',
    'conditional',
    'canonical_event.custom_data.items[].variant_id or item_id',
    'Dynamic remarketing product IDs.'
  ),
  parameter(
    'VID / anonymousId',
    'recommended',
    'UET browser cookie and ID sync',
    'Browser VID must be carried as CAPI anonymousId when server delivery is active.'
  ),
  parameter(
    'msclkid',
    'recommended',
    'landing URL and first-party persistence',
    'Preferred Microsoft click identifier.'
  )
] as const

const shopifyPurchaseBrowser = [
  parameter(
    'event',
    'required',
    'Shopify Customer Events',
    'Subscribed source event is checkout_completed.'
  ),
  parameter(
    'transaction_id',
    'required',
    'checkout.order.id',
    'Normalized as shopify_order_<numeric id>.'
  ),
  parameter(
    'items[].item_id',
    'required',
    'checkout.lineItems[].variant.id',
    'Shopify variant ID.'
  ),
  parameter(
    'items[].item_name',
    'required',
    'checkout.lineItems[].title',
    'Line item title.'
  ),
  parameter(
    'items[].quantity',
    'required',
    'checkout.lineItems[].quantity',
    'Purchased quantity.'
  ),
  parameter(
    'items[].price',
    'conditional',
    'checkout.lineItems[].variant.price.amount',
    'Numeric item price.'
  ),
  parameter(
    'items[].item_sku',
    'optional',
    'checkout.lineItems[].variant.sku',
    'SKU when present.'
  ),
  parameter(
    'items[].item_variant',
    'optional',
    'checkout.lineItems[].variant.title',
    'Variant title when present.'
  ),
  parameter(
    'currency',
    'required',
    'checkout.currencyCode',
    'Purchase currency.'
  ),
  parameter(
    'value',
    'required',
    'checkout.totalPrice.amount',
    'Purchase value.'
  ),
  parameter(
    'event_id',
    'required',
    'Shopify event.id',
    'Shopify Customer Events correlation ID.'
  ),
  parameter(
    'tax',
    'optional',
    'checkout.totalTax.amount',
    'Tax amount when present.'
  ),
  parameter(
    'shipping',
    'optional',
    'checkout.shippingLine.price.amount',
    'Shipping amount when present.'
  ),
  parameter(
    'page_location',
    'optional',
    'event.context.document.location.href',
    'Checkout page URL.'
  )
] as const

export const deliveryDocumentation = {
  meta: {
    title: 'Meta Conversions API parameters and deduplication',
    url: 'https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event'
  },
  google: {
    title: 'Google Data Manager API Event',
    url: 'https://developers.google.com/data-manager/api/reference/rest/v1/events'
  },
  microsoft: {
    title: 'Microsoft UET Conversion API integration',
    url: 'https://learn.microsoft.com/en-us/advertising/guides/uet-conversion-api-integration?view=bingads-13'
  },
  shopify: {
    title: 'Shopify Customer Events checkout_completed',
    url: 'https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed'
  }
} as const

export const deliveryIntegrations = {
  googleDataManager: {
    package: '@google-ads/datamanager',
    manifestVersion: '^0.5.0',
    role: 'Google server event protobuf types and transport',
    implementation: 'src/lib/analytics/server/googleDataManager'
  },
  metaParameterBuilder: {
    package: 'capi-param-builder-nodejs',
    manifestVersion: '^1.3.1',
    role: 'Trusted request-context extraction for fbc, fbp, IP, source URL, referrer, and hashed PII',
    implementation:
      'src/lib/analytics/server/processMetaParameterContext.ts'
  },
  metaBusinessSdk: {
    package: 'facebook-nodejs-business-sdk',
    manifestVersion:
      'file:vendor/facebook-nodejs-business-sdk-25.0.3.tgz',
    role: 'Meta ServerEvent, UserData, CustomData, Content, and EventRequest payloads',
    implementation: 'src/lib/analytics/server/meta'
  },
  shopifyGraphql: {
    package: '@shopify/graphql-client',
    manifestVersion: '^1.4.2',
    role: 'Shopify Storefront GraphQL transport; not a provider event SDK',
    implementation: 'src/lib/shopify'
  },
  shopifyHydrogen: {
    package: '@shopify/hydrogen-react',
    manifestVersion: '2026.4.3',
    role: 'Storefront commerce types and helpers; not a provider event SDK',
    implementation: 'src/lib/shopify'
  },
  microsoftUetCapi: {
    package: null,
    manifestVersion: null,
    role: 'Direct HTTP plus repository-owned Zod schemas',
    implementation: 'src/lib/analytics/server/microsoftUet'
  },
  shopifyCustomerEvents: {
    package: null,
    manifestVersion: null,
    role: 'Shopify-hosted browser pixel for checkout_completed to GA4/sGTM',
    implementation:
      'config/shopify/customer-events/ga4-commerce-pixel.js'
  }
} as const

function parametersFor(
  provider: string,
  transport: 'browser' | 'server',
  eventName: string,
  requiredParameters: readonly string[]
): Readonly<{
  parameterSets: readonly string[]
  logicalRequiredParameters: readonly string[]
}> {
  let parameterSets: readonly string[] = []

  if (provider === 'supabase')
    parameterSets = ['canonicalEnvelope']
  if (provider === 'google') {
    if (transport === 'server') parameterSets = ['googleServer']
    if (eventName === 'purchase')
      parameterSets = ['shopifyPurchaseBrowser']
    else if (transport === 'browser')
      parameterSets = ['googleBrowserDataLayer']
  }
  if (provider === 'meta')
    parameterSets = [
      transport === 'server' ? 'metaServer' : 'metaBrowser'
    ]
  if (provider === 'microsoft_uet')
    parameterSets = [
      transport === 'server' ?
        'microsoftServer'
      : 'microsoftBrowser'
    ]

  return {
    parameterSets,
    logicalRequiredParameters: requiredParameters
  }
}

export function buildUtekosEventDeliveryParameterContract() {
  return {
    contract: 'UtekosEventDeliveryParameters',
    version: '0.1.0',
    characterizedAgainst:
      '97a0a4538f9682a2b210e50b770ce59f826b42ac',
    generatedFrom: 'src/lib/analytics/eventCatalog.ts',
    documentation: deliveryDocumentation,
    integrations: deliveryIntegrations,
    invariants: [
      'Runtime Zod schemas remain authoritative for canonical acceptance.',
      'A parameter is not claimed as server-delivered when serverOutbox is blocked_no_worker or disabled.',
      'Browser and server deliveries of the same provider occurrence reuse event_id where the catalog permits browser/server sharing.',
      'PII and advertising identifiers remain consent-gated; coarse IP-derived event location is never substituted for customer-provided address PII.',
      'Provider payloads are derived from canonical data. Clients do not submit provider-native payloads to /api/events routes.'
    ],
    parameterSets: {
      canonicalEnvelope,
      googleBrowserDataLayer: [
        parameter(
          'event',
          'required',
          'event_name',
          'Canonical dataLayer event name.'
        ),
        parameter(
          'event_id',
          'required',
          'event_id',
          'Shared provider correlation ID.'
        ),
        parameter(
          'canonical_event',
          'required',
          'canonical payload',
          'Full consent-safe event object consumed by GTM.'
        )
      ],
      googleServer,
      metaBrowser,
      metaServer,
      microsoftBrowser,
      microsoftServer,
      shopifyPurchaseBrowser
    },
    events: Object.fromEntries(
      Object.entries(eventCatalog).map(([name, event]) => [
        name,
        {
          lifecycle: event.lifecycle,
          owner: event.owner,
          sources: event.trigger.sources,
          prerequisites: event.trigger.prerequisites,
          deduplication: event.dedupe,
          providers: Object.fromEntries(
            Object.entries(event.providers).map(
              ([provider, mapping]) => [
                provider,
                {
                  support: mapping.support,
                  eventName: mapping.eventName,
                  productionStatus: mapping.productionStatus,
                  productionDetail: mapping.productionDetail,
                  consentRequirement: mapping.consentRequirement,
                  dedupeField: mapping.dedupeField,
                  browser:
                    mapping.transport.browser === null ?
                      null
                    : {
                        transport: mapping.transport.browser,
                        status:
                          mapping.productionStatus === 'active' ?
                            'implemented'
                          : mapping.productionStatus,
                        parameterContract: parametersFor(
                          provider,
                          'browser',
                          name,
                          mapping.requiredParameters
                        )
                      },
                  server:
                    mapping.transport.server === null ?
                      null
                    : {
                        transport: mapping.transport.server,
                        status: mapping.serverOutbox,
                        parameterContract: parametersFor(
                          provider,
                          'server',
                          name,
                          mapping.requiredParameters
                        )
                      }
                }
              ]
            )
          )
        }
      ])
    )
  }
}
