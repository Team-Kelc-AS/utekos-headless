;(function () {
  'use strict'

  var META_PIXEL_ID = '1092362672918571'
  var META_PIXEL_URL =
    'https://connect.facebook.net/en_US/fbevents.js'
  var initialized = false
  var sent = Object.create(null)
  var privacy = init && init.customerPrivacy

  function marketingAllowed() {
    return Boolean(privacy && privacy.marketingAllowed === true)
  }

  function ensureFbq() {
    if (typeof window.fbq === 'function') return window.fbq

    var queue = function () {
      if (queue.callMethod) {
        queue.callMethod.apply(queue, arguments)
      } else {
        queue.queue.push(arguments)
      }
    }

    window.fbq = queue
    if (!window._fbq) window._fbq = queue
    queue.push = queue
    queue.loaded = true
    queue.version = '2.0'
    queue.queue = []

    return queue
  }

  function initializeMetaPixel(advancedMatch) {
    if (initialized || !marketingAllowed()) return false

    var fbq = ensureFbq()
    fbq('set', 'autoConfig', false, META_PIXEL_ID)
    fbq('init', META_PIXEL_ID, advancedMatch)
    fbq('consent', 'grant')

    if (
      !document.querySelector(
        'script[src="' + META_PIXEL_URL + '"]'
      )
    ) {
      var script = document.createElement('script')
      script.async = true
      script.src = META_PIXEL_URL

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

  function checkoutContents(checkout) {
    var lineItems = checkout && checkout.lineItems
    if (!Array.isArray(lineItems)) return []

    return lineItems.reduce(function (contents, lineItem) {
      var quantity = Number(lineItem && lineItem.quantity)
      var variant = lineItem && lineItem.variant
      var id = numericShopifyId(
        variant && variant.id,
        'ProductVariant'
      )

      if (!id || !Number.isInteger(quantity) || quantity <= 0) {
        return contents
      }

      var lineValue = finiteAmount(lineItem.finalLinePrice)
      var variantPrice = finiteAmount(variant && variant.price)
      var itemPrice =
        lineValue !== undefined ?
          lineValue / quantity
        : variantPrice
      var content = { id: id, quantity: quantity }

      if (itemPrice !== undefined) content.item_price = itemPrice
      contents.push(content)
      return contents
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

  async function advancedMatch(checkout) {
    var email = nonEmptyString(checkout && checkout.email)
    if (!email) return {}

    var digest = await sha256Bytes(email.toLowerCase())
    return digest ? { em: bytesToHex(digest) } : {}
  }

  async function sendPurchase(event) {
    if (!marketingAllowed()) return

    var checkout = event && event.data && event.data.checkout
    var orderId = numericShopifyId(
      checkout && checkout.order && checkout.order.id,
      'Order'
    )
    var eventKey = orderId ? 'purchase:' + orderId : undefined
    if (!eventKey || sent[eventKey]) return
    sent[eventKey] = 'pending'

    try {
      var currency = currencyCode(checkout)
      var value = finiteAmount(checkout && checkout.totalPrice)
      var contents = checkoutContents(checkout)

      if (
        !currency ||
        value === undefined ||
        contents.length === 0
      ) {
        delete sent[eventKey]
        return
      }

      var eventId = await deterministicPurchaseEventId(orderId)
      var match = await advancedMatch(checkout)
      if (!eventId || !marketingAllowed()) {
        delete sent[eventKey]
        return
      }
      if (!initializeMetaPixel(match)) {
        delete sent[eventKey]
        return
      }

      window.fbq(
        'trackSingle',
        META_PIXEL_ID,
        'Purchase',
        {
          content_ids: contents.map(function (content) {
            return content.id
          }),
          contents: contents,
          content_type: 'product',
          currency: currency,
          num_items: contents.reduce(function (sum, content) {
            return sum + content.quantity
          }, 0),
          value: value
        },
        { eventID: eventId }
      )
      sent[eventKey] = 'sent'
    } catch (_error) {
      delete sent[eventKey]
    }
  }

  api.customerPrivacy.subscribe(
    'visitorConsentCollected',
    function (event) {
      privacy = event && event.customerPrivacy

      if (initialized && typeof window.fbq === 'function') {
        window.fbq(
          'consent',
          marketingAllowed() ? 'grant' : 'revoke'
        )
      }
    }
  )

  analytics.subscribe('checkout_completed', sendPurchase)
})()
