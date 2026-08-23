;(function () {
  'use strict'

  // Public Pixel ID for the shared, active Utekos SnapPixel.
  var SNAPCHAT_PIXEL_ID = '3b3c8f0c-51f8-4b21-bf44-cc5e1121588a'
  var SNAPCHAT_PIXEL_URL = 'https://sc-static.net/scevent.min.js'
  var initialized = false
  var sent = Object.create(null)
  var privacy = init && init.customerPrivacy

  function marketingAllowed() {
    return Boolean(privacy && privacy.marketingAllowed === true)
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

  function initializeSnapchatPixel() {
    if (initialized) return true
    if (!marketingAllowed()) return false

    var snaptr = ensureSnaptr()
    snaptr('init', SNAPCHAT_PIXEL_ID)

    if (
      !document.querySelector(
        'script[src="' + SNAPCHAT_PIXEL_URL + '"]'
      )
    ) {
      var script = document.createElement('script')
      script.async = true
      script.src = SNAPCHAT_PIXEL_URL
      document.head.appendChild(script)
    }

    // Do not emit an automatic PAGE_VIEW from checkout.
    initialized = true
    return true
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

  function checkoutProducts(checkout) {
    var lineItems = checkout && checkout.lineItems
    if (!Array.isArray(lineItems)) return []

    return lineItems.reduce(function (products, lineItem) {
      var quantity = Number(lineItem && lineItem.quantity)
      var variant = lineItem && lineItem.variant
      var variantId = numericShopifyId(
        variant && variant.id,
        'ProductVariant'
      )

      if (
        !variantId ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return products
      }

      products.push({ id: variantId, quantity: quantity })
      return products
    }, [])
  }

  function commerceParameters(checkout, dedupeId) {
    var products = checkoutProducts(checkout)
    var currency = currencyCode(checkout)
    var value =
      finiteAmount(checkout && checkout.totalPrice) ??
      finiteAmount(checkout && checkout.subtotalPrice)

    if (
      !currency ||
      value === undefined ||
      products.length === 0
    ) {
      return undefined
    }

    return {
      client_dedup_id: dedupeId,
      currency: currency,
      item_ids: products.map(function (product) {
        return product.id
      }),
      number_items: products.reduce(function (sum, product) {
        return sum + product.quantity
      }, 0),
      price: value
    }
  }

  function sendAddBilling(event) {
    if (!marketingAllowed()) return

    var eventId =
      event && typeof event.id === 'string' ?
        event.id
      : undefined
    var eventKey = eventId ? 'billing:' + eventId : undefined
    if (!eventKey || sent[eventKey]) return

    var checkout = event && event.data && event.data.checkout
    var parameters = commerceParameters(checkout, eventId)
    if (!parameters || !initializeSnapchatPixel()) return

    window.snaptr('track', 'ADD_BILLING', parameters)
    sent[eventKey] = true
  }

  function sendPurchase(event) {
    if (!marketingAllowed()) return

    var checkout = event && event.data && event.data.checkout
    var orderId = numericShopifyId(
      checkout && checkout.order && checkout.order.id,
      'Order'
    )
    var transactionId =
      orderId ? 'shopify_order_' + orderId : undefined
    var eventKey =
      transactionId ? 'purchase:' + transactionId : undefined
    if (!eventKey || sent[eventKey]) return

    var parameters = commerceParameters(checkout, transactionId)
    if (!parameters || !initializeSnapchatPixel()) return

    parameters.transaction_id = transactionId
    window.snaptr('track', 'PURCHASE', parameters)
    sent[eventKey] = true
  }

  api.customerPrivacy.subscribe(
    'visitorConsentCollected',
    function (event) {
      privacy = event && event.customerPrivacy
    }
  )

  analytics.subscribe('payment_info_submitted', sendAddBilling)
  analytics.subscribe('checkout_completed', sendPurchase)
})()
