;(function () {
  'use strict'

  var PINTEREST_TAG_ID = '2613489421259'
  var PINTEREST_CORE_URL = 'https://s.pinimg.com/ct/core.js'
  var initialized = false
  var sent = Object.create(null)
  var privacy = init && init.customerPrivacy

  function marketingAllowed() {
    return Boolean(privacy && privacy.marketingAllowed === true)
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

  function initializePinterestTag(enhancedMatch) {
    if (initialized) return true

    var pintrk = ensurePintrk()
    if (Object.keys(enhancedMatch).length > 0) {
      pintrk('load', PINTEREST_TAG_ID, enhancedMatch)
    } else {
      pintrk('load', PINTEREST_TAG_ID)
    }

    if (
      !document.querySelector(
        'script[src="' + PINTEREST_CORE_URL + '"]'
      )
    ) {
      var script = document.createElement('script')
      script.async = true
      script.src = PINTEREST_CORE_URL

      var firstScript =
        document.getElementsByTagName('script')[0]
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript)
      } else {
        document.head.appendChild(script)
      }
    }

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

  function nonEmptyString(value) {
    return typeof value === 'string' && value.trim() ?
        value.trim()
      : undefined
  }

  function checkoutLineItems(checkout) {
    var lineItems = checkout && checkout.lineItems

    if (!Array.isArray(lineItems)) return []

    return lineItems.reduce(function (items, lineItem) {
      var quantity = Number(lineItem && lineItem.quantity)
      var variant = lineItem && lineItem.variant
      var product = variant && variant.product
      var productId = numericShopifyId(
        variant && variant.id,
        'ProductVariant'
      )
      var productName = nonEmptyString(
        lineItem && lineItem.title
      )

      if (
        !productId ||
        !productName ||
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
      var productBrand = nonEmptyString(
        product && product.vendor
      )
      var productCategory = nonEmptyString(
        product && product.type
      )
      var item = {
        product_id: productId,
        product_name: productName,
        product_quantity: quantity
      }

      if (price !== undefined) item.product_price = price
      if (productBrand) item.product_brand = productBrand
      if (productCategory)
        item.product_category = productCategory

      items.push(item)
      return items
    }, [])
  }

  async function sha256Bytes(value) {
    if (
      typeof value !== 'string' ||
      !value ||
      !window.crypto ||
      !window.crypto.subtle
    ) {
      return undefined
    }

    var encoded = new TextEncoder().encode(value)
    var digest = await window.crypto.subtle.digest(
      'SHA-256',
      encoded
    )

    return new Uint8Array(digest)
  }

  function bytesToHex(bytes) {
    return Array.from(bytes, function (byte) {
      return byte.toString(16).padStart(2, '0')
    }).join('')
  }

  async function enhancedMatch(checkout) {
    var email = nonEmptyString(checkout && checkout.email)
    if (!email) return {}

    var digest = await sha256Bytes(email.toLowerCase())
    return digest ? { em: bytesToHex(digest) } : {}
  }

  async function deterministicPurchaseEventId(orderId) {
    var digest = await sha256Bytes(
      'utekos:purchase:' + orderId + ':paid'
    )
    if (!digest) return undefined

    var bytes = digest.slice(0, 16)
    bytes[6] = (bytes[6] & 15) | 64
    bytes[8] = (bytes[8] & 63) | 128

    var hex = bytesToHex(bytes)
    return (
      hex.slice(0, 8) +
      '-' +
      hex.slice(8, 12) +
      '-' +
      hex.slice(12, 16) +
      '-' +
      hex.slice(16, 20) +
      '-' +
      hex.slice(20, 32)
    )
  }

  async function sendCheckout(event) {
    if (!marketingAllowed()) return

    var checkout = event && event.data && event.data.checkout
    var orderId = numericShopifyId(
      checkout && checkout.order && checkout.order.id,
      'Order'
    )
    var eventKey = orderId ? 'checkout:' + orderId : undefined

    if (!eventKey || sent[eventKey]) return
    sent[eventKey] = 'pending'

    try {
      var currency = currencyCode(checkout)
      var value = finiteAmount(checkout && checkout.totalPrice)
      var lineItems = checkoutLineItems(checkout)

      if (
        !currency ||
        value === undefined ||
        lineItems.length === 0
      ) {
        delete sent[eventKey]
        return
      }

      var eventId = await deterministicPurchaseEventId(orderId)
      if (!eventId) {
        delete sent[eventKey]
        return
      }

      var match = await enhancedMatch(checkout)
      if (!marketingAllowed()) {
        delete sent[eventKey]
        return
      }

      initializePinterestTag(match)
      window.pintrk('track', 'Checkout', {
        currency: currency,
        event_id: eventId,
        line_items: lineItems,
        order_id: 'shopify_order_' + orderId,
        order_quantity: lineItems.reduce(function (sum, item) {
          return sum + item.product_quantity
        }, 0),
        value: value
      })
      sent[eventKey] = 'sent'
    } catch (error) {
      delete sent[eventKey]
      throw error
    }
  }

  api.customerPrivacy.subscribe(
    'visitorConsentCollected',
    function (event) {
      privacy = event && event.customerPrivacy
    }
  )

  analytics.subscribe('checkout_completed', sendCheckout)
})()
