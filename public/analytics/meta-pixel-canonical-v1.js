;(function (w, d) {
  'use strict'

  w.dataLayer = w.dataLayer || []

  var PIXEL_ID = '1092362672918571'
  var EXTERNAL_ID_COOKIE = 'utekos_external_id'
  var TECHDOWN_PRODUCT_CATALOG_ID = '690208780604782'
  var TECHDOWN_CONTENT_IDS = {
    '46944403882232': true,
    '46944403915000': true,
    '48249962135800': true
  }
  var CANONICAL_BROWSER_EVENT =
    'utekos:meta-canonical-browser-event'
  var EVENT_NAMES = {
    page_view: 'PageView',
    view_item_list: 'ViewItemList',
    view_item: 'ViewContent',
    select_item: 'SelectItem',
    add_to_wishlist: 'AddToWishlist',
    add_to_cart: 'AddToCart',
    remove_from_cart: 'RemoveFromCart',
    view_cart: 'ViewCart',
    begin_checkout: 'InitiateCheckout',
    search: 'Search',
    generate_lead: 'Lead',
    // Existing Meta custom event name; canonical app contract is scroll_depth.
    scroll_depth: 'LandingScrollDepth',
    view_category: 'ViewCategory',
    hero_interact: 'HeroInteract',
    interact_with_accordion: 'InteractWithAccordion',
    open_quick_view: 'OpenQuickView'
  }
  var CUSTOM_EVENTS = {
    view_item_list: true,
    select_item: true,
    remove_from_cart: true,
    view_cart: true,
    scroll_depth: true,
    view_category: true,
    hero_interact: true,
    interact_with_accordion: true,
    open_quick_view: true
  }
  var state = w.__utekosMetaPixelState || {
    initialized: false,
    sent: {},
    dispatches: {},
    scriptStatus: 'idle',
    timer: null,
    listening: false,
    canonicalEventListening: false,
    lastDataLayerIndex: 0,
    poller: null
  }

  if (typeof state.lastDataLayerIndex !== 'number') {
    state.lastDataLayerIndex = 0
  }
  if (typeof state.poller === 'undefined') state.poller = null
  if (!state.dispatches) state.dispatches = {}
  if (typeof state.scriptStatus !== 'string') {
    state.scriptStatus = 'idle'
  }
  if (typeof state.canonicalEventListening === 'undefined') {
    state.canonicalEventListening = false
  }

  w.__utekosMetaPixelState = state

  var pendingFbcEvents = {}
  var fbcWaitStartedAt = null
  var fbcPagehideListening = false

  function shouldWaitForFbc() {
    if (readCookie('_fbc')) return false
    var hasClick = /(?:^|[?&])fbclid=[^&]+/.test(
      w.location.search || ''
    )
    // Match the eligibility of the generated Stape Cookie Keeper loader.
    var safari = /Version\/([0-9._]+)(.*Mobile)?.*Safari.*/.exec(
      (w.navigator && w.navigator.userAgent) || ''
    )
    var canRestore =
      safari &&
      parseFloat(safari[1]) >= 16.4 &&
      readCookie('user_id')
    if (!hasClick && !canRestore) return false
    if (fbcWaitStartedAt === null) fbcWaitStartedAt = Date.now()
    // Organic Safari visits may have no previous Meta click. Never fabricate
    // fbc or prevent delivery indefinitely when restoration is unavailable.
    return Date.now() - fbcWaitStartedAt < 3000
  }

  function readCookie(name) {
    var prefix = name + '='
    var parts = d.cookie ? d.cookie.split(';') : []
    var index

    for (index = 0; index < parts.length; index += 1) {
      var candidate = parts[index].replace(/^\s+|\s+$/g, '')

      if (candidate.indexOf(prefix) !== 0) continue

      try {
        return decodeURIComponent(candidate.slice(prefix.length))
      } catch (_error) {
        return null
      }
    }

    return null
  }

  function hasMarketingConsent() {
    return true
  }

  function discardPendingEvents() {
    state.lastDataLayerIndex = (w.dataLayer || []).length
  }

  function ensureExternalId() {
    var existing = readCookie(EXTERNAL_ID_COOKIE)

    if (existing) return existing
    if (!w.crypto || typeof w.crypto.randomUUID !== 'function')
      return null

    var externalId = 'anon_' + w.crypto.randomUUID()
    d.cookie =
      EXTERNAL_ID_COOKIE +
      '=' +
      encodeURIComponent(externalId) +
      '; Path=/; Max-Age=31536000; SameSite=Lax; Secure'

    return externalId
  }

  function installPixel(externalId) {
    if (!w.fbq) {
      var queue = function () {
        if (queue.callMethod) {
          queue.callMethod.apply(queue, arguments)
        } else {
          queue.queue.push(arguments)
        }
      }
      var firstScript
      var script

      w.fbq = queue
      if (!w._fbq) w._fbq = queue
      queue.push = queue
      queue.loaded = true
      queue.version = '2.0'
      queue.queue = []

      script = d.createElement('script')
      script.async = true
      script.src =
        'https://connect.facebook.net/en_US/fbevents.js'
      state.scriptStatus = 'loading'
      script.onload = function () {
        state.scriptStatus = 'loaded'
      }
      script.onerror = function () {
        state.scriptStatus = 'failed'
      }
      firstScript = d.getElementsByTagName('script')[0]

      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript)
      } else if (d.head) {
        d.head.appendChild(script)
      }
    }

    // The canonical PageView observer owns SPA events and their shared IDs.
    w.fbq.disablePushState = true
    w.fbq('set', 'autoConfig', false, PIXEL_ID)
    w.fbq(
      'init',
      PIXEL_ID,
      externalId ? { external_id: externalId } : {}
    )
    state.initialized = true
  }

  function syncPixelConsent() {
    if (!state.initialized || typeof w.fbq !== 'function') return

    var nextConsent = hasMarketingConsent() ? 'grant' : 'revoke'
    if (state.pixelConsent === nextConsent) return

    w.fbq('consent', nextConsent)
    state.pixelConsent = nextConsent
  }

  function contentId(variantId) {
    var match = /^gid:\/\/shopify\/ProductVariant\/(\d+)$/.exec(
      variantId || ''
    )

    return match ? match[1] : null
  }

  function finiteNumber(value) {
    return typeof value === 'number' && isFinite(value)
  }

  function isoCurrency(value) {
    if (typeof value !== 'string') return null

    var currency = value.replace(/^\s+|\s+$/g, '').toUpperCase()

    return /^[A-Z]{3}$/.test(currency) ? currency : null
  }

  function commerceData(eventName, customData) {
    var items = customData && customData.items
    var contentIds = []
    var contents = []
    var index
    var currency
    var value
    var numItems = 0

    if (!items || !items.length) return null

    for (index = 0; index < items.length; index += 1) {
      var item = items[index]
      var id = contentId(item.variant_id)
      var content

      if (!id) continue

      content = { id: id, quantity: item.quantity }

      if (finiteNumber(item.gross_unit_price)) {
        content.item_price = item.gross_unit_price
      }

      contentIds.push(id)
      contents.push(content)
      if (finiteNumber(item.quantity)) numItems += item.quantity
    }

    if (!contentIds.length) return null

    var primary = items[0]
    var result = {
      content_ids: contentIds,
      contents: contents,
      content_type: 'product',
      country: 'Norway'
    }

    if (
      contentIds.every(function (id) {
        return TECHDOWN_CONTENT_IDS[id] === true
      })
    ) {
      result.product_catalog_id = TECHDOWN_PRODUCT_CATALOG_ID
    }

    if (eventName === 'begin_checkout') {
      result.num_items = numItems
    }

    currency = isoCurrency(customData.currency)
    value =
      finiteNumber(customData.gross_value) ?
        customData.gross_value
      : null

    // Meta warns on invalid/empty currency; never send value without ISO currency.
    if (currency && value !== null) {
      result.currency = currency
      result.value = value
    }

    if (primary.item_name)
      result.content_name = primary.item_name
    if (primary.item_category || primary.product_type) {
      result.content_category =
        primary.item_category || primary.product_type
    }

    var customFields = [
      'accordion_id',
      'accordion_title',
      'cart_id',
      'gross_value',
      'impression_sequence',
      'interaction_sequence',
      'interaction_type',
      'item_list_id',
      'item_list_name',
      'open_sequence',
      'source_surface',
      'tax_value',
      'total_item_count',
      'view_sequence'
    ]

    for (index = 0; index < customFields.length; index += 1) {
      var field = customFields[index]
      var fieldValue = customData[field]

      if (
        (typeof fieldValue === 'string' && fieldValue) ||
        finiteNumber(fieldValue)
      ) {
        result[field] = fieldValue
      }
    }

    if (finiteNumber(customData.value)) {
      result.net_value = customData.value
    }

    return result
  }

  function eventData(eventName, canonicalEvent) {
    var customData = canonicalEvent.custom_data || {}

    if (eventName === 'page_view') {
      return {}
    }

    if (
      eventName === 'view_item' ||
      eventName === 'view_item_list' ||
      eventName === 'select_item' ||
      eventName === 'add_to_wishlist' ||
      eventName === 'add_to_cart' ||
      eventName === 'remove_from_cart' ||
      eventName === 'view_cart' ||
      eventName === 'begin_checkout' ||
      eventName === 'interact_with_accordion' ||
      eventName === 'open_quick_view'
    ) {
      return commerceData(eventName, customData)
    }

    if (eventName === 'search') {
      return customData.search_term ?
          { search_string: customData.search_term }
        : {}
    }

    if (eventName === 'scroll_depth') {
      var scroll = {}

      if (finiteNumber(customData.threshold)) {
        scroll.threshold = customData.threshold
      }
      if (finiteNumber(customData.percent_scrolled)) {
        scroll.percent_scrolled = customData.percent_scrolled
      }
      if (finiteNumber(customData.document_height)) {
        scroll.document_height = customData.document_height
      }

      return scroll
    }

    if (eventName === 'view_category') {
      var category = {}
      var categoryContentIds = []
      var categoryIndex

      if (customData.category_id) {
        category.content_category = customData.category_id
        category.category_id = customData.category_id
      }
      if (customData.category_name) {
        category.content_name = customData.category_name
        category.category_name = customData.category_name
      }
      if (finiteNumber(customData.view_sequence)) {
        category.view_sequence = customData.view_sequence
      }
      if (Array.isArray(customData.content_ids)) {
        for (
          categoryIndex = 0;
          categoryIndex < customData.content_ids.length &&
          categoryContentIds.length < 10;
          categoryIndex += 1
        ) {
          var categoryContentId =
            customData.content_ids[categoryIndex]
          if (
            typeof categoryContentId === 'string' &&
            /^\d+$/.test(categoryContentId)
          ) {
            categoryContentIds.push(categoryContentId)
          }
        }
        if (categoryContentIds.length > 0) {
          category.content_ids = categoryContentIds
          category.content_type = 'product'
        }
      }

      return category
    }

    if (eventName === 'hero_interact') {
      var hero = {}

      if (customData.cta_id) {
        hero.content_name = customData.cta_id
        hero.cta_id = customData.cta_id
      }
      if (customData.destination_path) {
        hero.content_category = customData.destination_path
        hero.destination_path = customData.destination_path
      }
      if (finiteNumber(customData.click_sequence)) {
        hero.click_sequence = customData.click_sequence
      }

      return hero
    }

    if (eventName === 'generate_lead') {
      var lead = {}
      var leadCurrency = isoCurrency(customData.currency)
      var leadValue =
        finiteNumber(customData.value) ? customData.value : null

      if (leadCurrency && leadValue !== null && leadValue > 0) {
        lead.currency = leadCurrency
        lead.value = leadValue
      }

      return lead
    }

    return {}
  }

  function metaEventNameForEntry(entry) {
    var canonicalEvent = entry && entry.canonical_event
    var customData = canonicalEvent && canonicalEvent.custom_data
    var itemListId = customData && customData.item_list_id

    if (
      entry &&
      entry.event === 'select_item' &&
      (itemListId === 'techdown-size-selector' ||
        itemListId === 'sticky-cta-catalog')
    ) {
      return 'CustomizeProduct'
    }

    return entry ? EVENT_NAMES[entry.event] : null
  }

  function dispatch(entry, finishWaiting) {
    var canonicalEvent = entry.canonical_event
    var metaEventName = metaEventNameForEntry(entry)
    var eventKey
    var data

    if (
      !canonicalEvent ||
      !metaEventName ||
      !canonicalEvent.consent ||
      canonicalEvent.consent.marketing !== 'granted' ||
      w.__utekosConsentReloading
    )
      return
    if (entry.event_id !== canonicalEvent.event_id) return
    if (entry.event !== canonicalEvent.event_name) return

    eventKey = metaEventName + ':' + entry.event_id
    if (state.sent[eventKey]) return

    if (!finishWaiting && shouldWaitForFbc()) {
      pendingFbcEvents[eventKey] = entry
      if (!fbcPagehideListening) {
        fbcPagehideListening = true
        // Release queued events if the visitor leaves before restoration.
        w.addEventListener('pagehide', function () {
          Object.keys(pendingFbcEvents).forEach(function (key) {
            dispatch(pendingFbcEvents[key], true)
          })
        })
      }
      return
    }
    delete pendingFbcEvents[eventKey]

    data = eventData(entry.event, canonicalEvent)
    if (data === null) return

    var command =
      (
        CUSTOM_EVENTS[entry.event] &&
        metaEventName !== 'CustomizeProduct'
      ) ?
        'trackSingleCustom'
      : 'trackSingle'

    w.fbq(command, PIXEL_ID, metaEventName, data, {
      eventID: entry.event_id
    })

    state.dispatches[eventKey] = {
      eventId: entry.event_id,
      eventName: metaEventName,
      scriptStatus: state.scriptStatus
    }
    state.sent[eventKey] = true
  }

  function listenForCanonicalEvents() {
    if (state.canonicalEventListening) return
    state.canonicalEventListening = true

    w.addEventListener(
      CANONICAL_BROWSER_EVENT,
      function (event) {
        if (!hasMarketingConsent()) return
        dispatch(event && event.detail)
      }
    )
  }

  function scanDataLayer() {
    var dataLayer = w.dataLayer || []
    var startIndex = state.lastDataLayerIndex
    var index

    if (startIndex > dataLayer.length) startIndex = 0

    for (
      index = startIndex;
      index < dataLayer.length;
      index += 1
    ) {
      var entry = dataLayer[index]

      if (!entry || typeof entry !== 'object') continue
      if (typeof entry.event_id !== 'string' || !entry.event_id)
        continue
      dispatch(entry)
    }

    state.lastDataLayerIndex = dataLayer.length
  }

  function scheduleConsentRetry() {
    if (state.listening) return
    state.listening = true

    var retry = function () {
      syncPixelConsent()
      if (hasMarketingConsent()) {
        run()
      } else {
        discardPendingEvents()
      }
    }

    retry()
  }

  function run() {
    state.timer = null
    syncPixelConsent()
    if (!hasMarketingConsent()) {
      scheduleConsentRetry()
      discardPendingEvents()
      return
    }

    var externalId =
      readCookie(EXTERNAL_ID_COOKIE) || ensureExternalId()
    // Install as soon as marketing is granted. Do not wait for _fbp —
    // fbevents.js creates it. Waiting blocked SPA clicks / returning visits.
    if (!state.initialized) installPixel(externalId)
    syncPixelConsent()

    scanDataLayer()
    Object.keys(pendingFbcEvents).forEach(function (key) {
      dispatch(pendingFbcEvents[key])
    })
  }

  function startPolling() {
    if (state.poller !== null) return

    state.poller = w.setInterval(function () {
      syncPixelConsent()
      if (hasMarketingConsent()) {
        run()
      } else {
        // Only events observed with marketing consent are eligible.
        discardPendingEvents()
      }
    }, 200)
  }

  scheduleConsentRetry()
  if (state.timer === null) run()
  listenForCanonicalEvents()
  startPolling()
})(window, document)
