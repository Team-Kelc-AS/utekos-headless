;(() => {
  'use strict'

  const BRIDGE_VERSION = '1.0.0'
  const LOADER_ID = 'snapchat-pixel-canonical-browser'
  const SNAP_PIXEL_URL = 'https://sc-static.net/scevent.min.js'
  const EVENT_MAP = Object.freeze({
    page_view: 'PAGE_VIEW',
    view_item: 'VIEW_CONTENT',
    add_to_cart: 'ADD_CART',
    begin_checkout: 'START_CHECKOUT'
  })

  const trackedEventIds = new Set()
  const discardedEventIds = new Set()
  let pixelLoaded = false

  function asRecord(value) {
    return (
        value &&
          typeof value === 'object' &&
          !Array.isArray(value)
      ) ?
        value
      : null
  }

  function getPixelId() {
    const loader = document.getElementById(LOADER_ID)
    return loader?.dataset?.pixelId?.trim() || ''
  }

  function hasMarketingConsent() {
    return window.Cookiebot?.consent?.marketing === true
  }

  function hasConsentDecision() {
    return window.Cookiebot?.hasResponse === true
  }

  function isProductionEvent(event) {
    return event?.environment === 'production'
  }

  function ensureSnaptr() {
    if (typeof window.snaptr === 'function') return window.snaptr

    window.snaptr = function () {
      if (window.snaptr.handleRequest) {
        window.snaptr.handleRequest.apply(
          window.snaptr,
          arguments
        )
      } else {
        window.snaptr.queue.push(arguments)
      }
    }
    window.snaptr.queue = []

    return window.snaptr
  }

  function loadPixel() {
    if (pixelLoaded) return true

    const pixelId = getPixelId()
    if (!pixelId) return false

    const snaptr = ensureSnaptr()
    snaptr('init', pixelId)

    if (
      !document.querySelector(`script[src="${SNAP_PIXEL_URL}"]`)
    ) {
      const script = document.createElement('script')
      script.async = true
      script.src = SNAP_PIXEL_URL
      document.head.appendChild(script)
    }

    // Initialization deliberately does not emit PAGE_VIEW. Every event
    // must originate from the canonical dataLayer occurrence below.
    pixelLoaded = true
    return true
  }

  function finiteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ?
        value
      : undefined
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

  function variantId(item) {
    const candidate =
      typeof item?.variant_id === 'string' ? item.variant_id
      : typeof item?.item_id === 'string' ? item.item_id
      : undefined
    if (!candidate) return undefined
    const value = candidate.trim()
    const gidMatch = /^gid:\/\/shopify\/ProductVariant\/([0-9]+)$/.exec(
      value
    )
    if (gidMatch) return gidMatch[1]
    return /^[0-9]+$/.test(value) ? value : undefined
  }

  function buildEventData(canonicalEvent) {
    const customData = asRecord(canonicalEvent.custom_data) ?? {}
    const items =
      Array.isArray(customData.items) ?
        customData.items.filter(asRecord)
      : []
    const itemIds = items.map(variantId).filter(Boolean)
    const value = finiteNumber(customData.value)
    const currency =
      (
        typeof customData.currency === 'string' &&
        /^[A-Z]{3}$/.test(customData.currency)
      ) ?
        customData.currency
      : undefined
    const numberItems = items.reduce(
      (sum, item) => sum + (positiveInteger(item.quantity) ?? 1),
      0
    )

    return {
      client_dedup_id: canonicalEvent.event_id,
      ...(itemIds.length > 0 ? { item_ids: itemIds } : {}),
      ...(value !== undefined ? { price: value } : {}),
      ...(currency ? { currency } : {}),
      ...(numberItems > 0 ? { number_items: numberItems } : {})
    }
  }

  function clearSnapchatIdentifiers() {
    const sessionKey = 'utekos_click_ids'
    const durableKey = 'utekos_click_ids_v1'

    try {
      const session = JSON.parse(
        window.sessionStorage.getItem(sessionKey) || '{}'
      )
      delete session.sc_click_id
      window.sessionStorage.setItem(
        sessionKey,
        JSON.stringify(session)
      )
    } catch {}

    try {
      const durable = JSON.parse(
        window.localStorage.getItem(durableKey) || '{}'
      )
      if (asRecord(durable.identifiers)) {
        delete durable.identifiers.sc_click_id
      }
      window.localStorage.setItem(
        durableKey,
        JSON.stringify(durable)
      )
    } catch {}

    for (const domain of ['', '; Domain=.utekos.no']) {
      document.cookie = `_scid=; Max-Age=0; Path=/${domain}; SameSite=Lax; Secure`
    }
  }

  function processCanonicalEvent(canonicalEvent) {
    if (!asRecord(canonicalEvent)) return
    if (canonicalEvent.schema_version !== 1) return
    if (typeof canonicalEvent.event_id !== 'string') return
    if (!hasMarketingConsent()) return
    if (!isProductionEvent(canonicalEvent)) return

    const eventName = EVENT_MAP[canonicalEvent.event_name]
    if (!eventName) return
    if (discardedEventIds.has(canonicalEvent.event_id)) return
    if (trackedEventIds.has(canonicalEvent.event_id)) return
    if (!loadPixel()) return

    window.snaptr(
      'track',
      eventName,
      buildEventData(canonicalEvent)
    )
    trackedEventIds.add(canonicalEvent.event_id)
  }

  function processDataLayerEntry(entry) {
    if (!asRecord(entry)) return
    const canonicalEvent = entry.canonical_event

    if (hasMarketingConsent()) {
      processCanonicalEvent(canonicalEvent)
      return
    }

    if (
      hasConsentDecision() &&
      asRecord(canonicalEvent) &&
      typeof canonicalEvent.event_id === 'string'
    ) {
      discardedEventIds.add(canonicalEvent.event_id)
    }
  }

  function processExistingDataLayer() {
    const dataLayer =
      Array.isArray(window.dataLayer) ? window.dataLayer : []
    for (const entry of dataLayer) processDataLayerEntry(entry)
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
      for (const entry of entries) processDataLayerEntry(entry)
      return result
    }
  }

  function onConsentChanged() {
    if (window.Cookiebot?.consent?.marketing === true) {
      processExistingDataLayer()
      return
    }
    clearSnapchatIdentifiers()
  }

  subscribeToDataLayer()
  processExistingDataLayer()

  window.addEventListener(
    'CookiebotOnConsentReady',
    onConsentChanged
  )
  window.addEventListener('CookiebotOnAccept', onConsentChanged)
  window.addEventListener('CookiebotOnDecline', onConsentChanged)

  window.__utekosSnapchatCanonical = Object.freeze({
    bridgeVersion: BRIDGE_VERSION,
    eventMap: EVENT_MAP,
    processCanonicalEvent
  })
})()
