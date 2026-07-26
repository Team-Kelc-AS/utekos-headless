;(function () {
  'use strict'

  var GOOGLE_TAG_ID = 'GT-MKRLF5WK'
  var SGTM_ORIGIN = 'https://utekos.no/__sgtm'
  var initialized = false
  var sent = Object.create(null)
  var privacy = init && init.customerPrivacy

  window.dataLayer = window.dataLayer || []

  function gtag() {
    window.dataLayer.push(arguments)
  }

  function analyticsAllowed() {
    return Boolean(
      privacy && privacy.analyticsProcessingAllowed === true
    )
  }

  function googleConsent(analyticsStorage) {
    return {
      analytics_storage: analyticsStorage,
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    }
  }

  function initializeGoogleTag() {
    if (initialized || !analyticsAllowed()) return

    gtag('consent', 'default', googleConsent('granted'))
    gtag('js', new Date())
    gtag('config', GOOGLE_TAG_ID, {
      allow_ad_personalization_signals: false,
      allow_google_signals: false,
      send_page_view: false,
      server_container_url: SGTM_ORIGIN
    })

    var script = document.createElement('script')
    script.async = true
    script.src = SGTM_ORIGIN + '/gtag/js?id=' + GOOGLE_TAG_ID
    document.head.appendChild(script)
    initialized = true
  }

  function finiteAmount(money) {
    var amount = Number(money && money.amount)

    return Number.isFinite(amount) && amount >= 0 ?
        amount
      : undefined
  }

  function currencyCode(checkout) {
    var currency = checkout && checkout.currencyCode

    return (
        typeof currency === 'string' &&
          /^[A-Z]{3}$/.test(currency)
      ) ?
        currency
      : undefined
  }

  function numericShopifyId(value, resource) {
    if (typeof value !== 'string') return undefined

    var match = new RegExp(
      '^gid://shopify/' + resource + '/([0-9]+)$'
    ).exec(value)

    return match ? match[1] : undefined
  }

  function transactionId(checkout) {
    var orderId = numericShopifyId(
      checkout && checkout.order && checkout.order.id,
      'Order'
    )

    return orderId ? 'shopify_order_' + orderId : undefined
  }

  function checkoutItems(checkout) {
    var lineItems = checkout && checkout.lineItems

    if (!Array.isArray(lineItems)) return []

    return lineItems.reduce(function (items, lineItem) {
      var quantity = Number(lineItem && lineItem.quantity)
      var variant = lineItem && lineItem.variant
      var itemId =
        numericShopifyId(
          variant && variant.id,
          'ProductVariant'
        ) ||
        numericShopifyId(
          lineItem && lineItem.id,
          'CheckoutLineItem'
        )
      var itemName =
        lineItem && typeof lineItem.title === 'string' ?
          lineItem.title.trim()
        : ''

      if (
        !itemId ||
        !itemName ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return items
      }

      var lineValue = finiteAmount(lineItem.finalLinePrice)
      var variantPrice = finiteAmount(variant && variant.price)
      var price =
        lineValue !== undefined ?
          lineValue / quantity
        : variantPrice
      var item = {
        item_id: itemId,
        item_name: itemName,
        quantity: quantity
      }

      if (price !== undefined) item.price = price
      if (
        variant &&
        typeof variant.sku === 'string' &&
        variant.sku.trim()
      ) {
        item.item_sku = variant.sku.trim()
      }
      if (
        variant &&
        typeof variant.title === 'string' &&
        variant.title.trim()
      ) {
        item.item_variant = variant.title.trim()
      }

      items.push(item)
      return items
    }, [])
  }

  function pageLocation(event) {
    var context = event && event.context
    var documentLocation =
      context && context.document && context.document.location
    var windowLocation =
      context && context.window && context.window.location

    return (
      (documentLocation && documentLocation.href) ||
      (windowLocation && windowLocation.href) ||
      undefined
    )
  }

  function checkoutParameters(event) {
    var checkout = event && event.data && event.data.checkout
    var currency = currencyCode(checkout)
    var items = checkoutItems(checkout)
    var value = finiteAmount(checkout && checkout.subtotalPrice)
    var location = pageLocation(event)
    var parameters = { items: items }

    if (currency) parameters.currency = currency
    if (value !== undefined) parameters.value = value
    if (location) parameters.page_location = location
    if (event && typeof event.id === 'string') {
      parameters.event_id = event.id
    }

    return parameters
  }

  function sendPaymentInfo(event) {
    if (!analyticsAllowed()) return

    var eventKey = 'add_payment_info:' + (event && event.id)
    if (sent[eventKey]) return

    var parameters = checkoutParameters(event)
    if (!parameters.currency || parameters.items.length === 0)
      return

    initializeGoogleTag()
    gtag('event', 'add_payment_info', parameters)
    sent[eventKey] = true
  }

  function sendPurchase(event) {
    if (!analyticsAllowed()) return

    var checkout = event && event.data && event.data.checkout
    var purchaseTransactionId = transactionId(checkout)
    var eventKey = 'purchase:' + purchaseTransactionId

    if (!purchaseTransactionId || sent[eventKey]) return

    var parameters = checkoutParameters(event)
    if (!parameters.currency || parameters.items.length === 0)
      return

    parameters.transaction_id = purchaseTransactionId

    var tax = finiteAmount(checkout && checkout.totalTax)
    var shipping = finiteAmount(
      checkout &&
        checkout.shippingLine &&
        checkout.shippingLine.price
    )

    if (tax !== undefined) parameters.tax = tax
    if (shipping !== undefined) parameters.shipping = shipping

    initializeGoogleTag()
    gtag('event', 'purchase', parameters)
    sent[eventKey] = true
  }

  api.customerPrivacy.subscribe(
    'visitorConsentCollected',
    function (event) {
      privacy = event && event.customerPrivacy

      if (analyticsAllowed()) {
        initializeGoogleTag()
        gtag('consent', 'update', googleConsent('granted'))
      } else if (initialized) {
        gtag('consent', 'update', googleConsent('denied'))
      }
    }
  )

  analytics.subscribe('payment_info_submitted', sendPaymentInfo)
  analytics.subscribe('checkout_completed', sendPurchase)
  initializeGoogleTag()
})()
