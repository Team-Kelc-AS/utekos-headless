;(() => {
  'use strict'

  const BRIDGE_VERSION = '1.0.0'
  const LOADER_ID = 'pinterest-tag-canonical-browser'
  const PINTEREST_CORE_URL = 'https://s.pinimg.com/ct/core.js'

  // Keep this table semantically aligned with
  // src/lib/analytics/pinterestEventMapping.ts.
  //
  // Generic canonical page_view is deliberately not mapped:
  // product view_item owns Pinterest PageVisit so PageVisit carries
  // catalog product IDs instead of creating a second, ID-less visit.
  const EVENT_MAP = Object.freeze({
    add_payment_info: 'AddPaymentInfo',
    add_to_cart: 'AddToCart',
    add_to_wishlist: 'AddToWishList',
    begin_checkout: 'InitiateCheckout',
    generate_lead: 'Lead',
    purchase: 'Checkout',
    search: 'Search',
    view_category: 'ViewCategory',
    view_item: 'PageVisit'
  })

  const trackedEventIds = new Set()
  const pendingEventIds = new Set()
  let pinterestLoaded = false

  function getTagId() {
    const loader = document.getElementById(LOADER_ID)
    return loader?.dataset?.tagId?.trim() || ''
  }

  function hasMarketingConsent(canonicalEvent) {
    return canonicalEvent?.consent?.marketing === 'granted'
  }

  function isProductionEvent(canonicalEvent) {
    return canonicalEvent?.environment === 'production'
  }

  function ensurePintrk() {
    if (typeof window.pintrk === 'function') return window.pintrk

    window.pintrk = function () {
      window.pintrk.queue.push(
        Array.prototype.slice.call(arguments)
      )
    }
    window.pintrk.queue = []
    window.pintrk.version = '3.0'

    return window.pintrk
  }

  function loadPinterestTag(enhancedMatch) {
    if (pinterestLoaded) return true

    const tagId = getTagId()
    if (!tagId) return false

    const pintrk = ensurePintrk()
    if (Object.keys(enhancedMatch).length > 0) {
      pintrk('load', tagId, enhancedMatch)
    } else {
      pintrk('load', tagId)
    }

    if (
      !document.querySelector(
        `script[src="${PINTEREST_CORE_URL}"]`
      )
    ) {
      const script = document.createElement('script')
      script.async = true
      script.src = PINTEREST_CORE_URL

      const firstScript =
        document.getElementsByTagName('script')[0]
      if (firstScript?.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript)
      } else {
        document.head.appendChild(script)
      }
    }

    // Do NOT call pintrk('page') here. PageVisit must originate from
    // Canonical view_item with Canonical event_id + product IDs so the
    // browser event and Conversions API event can deduplicate.
    pinterestLoaded = true
    return true
  }

  function asRecord(value) {
    return (
        value &&
          typeof value === 'object' &&
          !Array.isArray(value)
      ) ?
        value
      : null
  }

  function finiteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ?
        value
      : undefined
  }

  async function sha256(value) {
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      !window.crypto?.subtle
    ) {
      return undefined
    }

    const bytes = new TextEncoder().encode(value.trim())
    const digest = await window.crypto.subtle.digest(
      'SHA-256',
      bytes
    )

    return Array.from(new Uint8Array(digest), byte =>
      byte.toString(16).padStart(2, '0')
    ).join('')
  }

  async function buildEnhancedMatch(canonicalEvent) {
    const email =
      Array.isArray(canonicalEvent?.user_data?.email_sha256) ?
        canonicalEvent.user_data.email_sha256[0]
      : undefined
    const externalId = await sha256(canonicalEvent.external_id)

    return {
      ...(email ? { em: email } : {}),
      ...(externalId ? { external_id: externalId } : {})
    }
  }

  function positiveInteger(value) {
    const number = finiteNumber(value)
    return (
        number !== undefined &&
          Number.isInteger(number) &&
          number > 0
      ) ?
        number
      : undefined
  }

  function cleanShopifyId(id) {
    if (!id) return undefined

    const cleaned = String(id).split('/').pop()?.split('?')[0]
    return cleaned || undefined
  }

  // Must match src/lib/analytics/pinterestCatalogIdentity.ts:
  // Canonical item_id GID → Pinterest Catalog feed id.
  function productId(item) {
    const rawItemId =
      typeof item?.item_id === 'string' ?
        item.item_id.trim()
      : ''

    return rawItemId ? cleanShopifyId(rawItemId) : undefined
  }

  function mapLineItem(item) {
    const id = productId(item)
    if (!id) return null

    const price =
      finiteNumber(item.final_unit_price) ??
      finiteNumber(item.unit_price)
    const quantity = positiveInteger(item.quantity)
    const productName =
      typeof item.item_name === 'string' ?
        item.item_name
      : undefined
    const productBrand =
      typeof item.item_brand === 'string' ?
        item.item_brand
      : undefined
    const productCategory =
      typeof item.item_category === 'string' ? item.item_category
      : typeof item.product_type === 'string' ? item.product_type
      : undefined
    const variantId =
      typeof item.variant_id === 'string' ?
        item.variant_id
      : undefined
    const variantName =
      typeof item.item_variant === 'string' ?
        item.item_variant
      : undefined

    return {
      product_id: id,
      ...(productName ? { product_name: productName } : {}),
      ...(productBrand ? { product_brand: productBrand } : {}),
      ...(productCategory ?
        { product_category: productCategory }
      : {}),
      ...(variantId ? { product_variant_id: variantId } : {}),
      ...(variantName ? { product_variant: variantName } : {}),
      ...(price !== undefined ? { product_price: price } : {}),
      ...(quantity ? { product_quantity: quantity } : {})
    }
  }

  function readSearchQuery(customData) {
    for (const key of [
      'search_string',
      'search_query',
      'search_term',
      'query'
    ]) {
      const value = customData?.[key]
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }
    return undefined
  }

  function buildEventData(canonicalEvent) {
    const customData = asRecord(canonicalEvent.custom_data) ?? {}
    const items =
      Array.isArray(customData.items) ?
        customData.items.filter(item => asRecord(item))
      : []
    const lineItems = items.map(mapLineItem).filter(Boolean)
    const value = finiteNumber(customData.value)
    const currency =
      (
        typeof customData.currency === 'string' &&
        /^[A-Z]{3}$/.test(customData.currency)
      ) ?
        customData.currency
      : undefined
    const orderQuantity = lineItems.reduce(
      (sum, item) => sum + (item.product_quantity ?? 1),
      0
    )
    const orderId =
      typeof customData.transaction_id === 'string' ?
        customData.transaction_id
      : undefined
    const searchQuery = readSearchQuery(customData)

    return {
      event_id: canonicalEvent.event_id,
      ...(value !== undefined && value > 0 ? { value } : {}),
      ...(currency ? { currency } : {}),
      ...(orderQuantity > 0 ?
        { order_quantity: orderQuantity }
      : {}),
      ...(orderId ? { order_id: orderId } : {}),
      ...(lineItems.length > 0 ? { line_items: lineItems } : {}),
      ...(searchQuery ? { search_query: searchQuery } : {})
    }
  }

  async function processCanonicalEvent(canonicalEvent) {
    if (!asRecord(canonicalEvent)) return
    if (canonicalEvent.schema_version !== 1) return
    if (typeof canonicalEvent.event_id !== 'string') return
    if (typeof canonicalEvent.event_name !== 'string') return
    if (!hasMarketingConsent(canonicalEvent)) return
    if (!isProductionEvent(canonicalEvent)) return

    const pinterestEventName =
      EVENT_MAP[canonicalEvent.event_name]
    if (!pinterestEventName) return
    if (trackedEventIds.has(canonicalEvent.event_id)) return
    if (pendingEventIds.has(canonicalEvent.event_id)) return

    pendingEventIds.add(canonicalEvent.event_id)

    try {
      const enhancedMatch =
        await buildEnhancedMatch(canonicalEvent)
      if (!loadPinterestTag(enhancedMatch)) return

      window.pintrk(
        'track',
        pinterestEventName,
        buildEventData(canonicalEvent)
      )
      trackedEventIds.add(canonicalEvent.event_id)
    } finally {
      pendingEventIds.delete(canonicalEvent.event_id)
    }
  }

  function processDataLayerEntry(entry) {
    if (!asRecord(entry)) return
    void processCanonicalEvent(entry.canonical_event)
  }

  function processExistingDataLayer() {
    const dataLayer =
      Array.isArray(window.dataLayer) ? window.dataLayer : []

    for (const entry of dataLayer) {
      processDataLayerEntry(entry)
    }
  }

  function subscribeToDataLayer() {
    window.dataLayer = window.dataLayer || []

    const originalPush = window.dataLayer.push.bind(
      window.dataLayer
    )

    window.dataLayer.push = function () {
      const entries = Array.from(arguments)
      const result = originalPush.apply(
        window.dataLayer,
        entries
      )

      for (const entry of entries) {
        processDataLayerEntry(entry)
      }

      return result
    }
  }

  function onConsentChanged() {
    processExistingDataLayer()
  }

  subscribeToDataLayer()
  processExistingDataLayer()

  window.addEventListener(
    'CookiebotOnConsentReady',
    onConsentChanged
  )
  window.addEventListener('CookiebotOnAccept', onConsentChanged)

  window.__utekosPinterestCanonical = Object.freeze({
    bridgeVersion: BRIDGE_VERSION,
    eventMap: EVENT_MAP,
    processCanonicalEvent
  })
})()
