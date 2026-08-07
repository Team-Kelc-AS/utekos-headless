import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const html = readFileSync(
  new URL('../../config/gtm/web-meta-pixel.html', import.meta.url),
  'utf8'
)
const script = html.match(/^<script>\n([\s\S]+)\n<\/script>\n?$/)?.[1]
const publicScript = readFileSync(
  new URL(
    '../../public/analytics/meta-pixel-canonical-v1.js',
    import.meta.url
  ),
  'utf8'
).trimEnd()

assert.ok(script, 'Expected one executable script block')
assert.equal(publicScript, script, 'GTM and app Pixel code must stay identical')

function canonicalEvent(eventName, eventId, customData = {}) {
  return {
    event: eventName,
    event_id: eventId,
    canonical_event: {
      event_id: eventId,
      event_name: eventName,
      page_url: 'https://utekos.no/produkter/utekos-techdown?fbclid=click-1',
      custom_data: customData,
      consent: { marketing: 'denied' }
    }
  }
}

function createRuntime({ marketing = true } = {}) {
  const insertedScripts = []
  const intervals = []
  const document = {
    cookie: [
      'utekos_external_id=anon_550e8400-e29b-41d4-a716-446655440000',
      '_fbp=fb.1.1234567890.1234567890.AQQCAQMB',
      '_fbc=fb.1.1234567890.click-1.AQQCAQMB'
    ].join('; '),
    createElement: () => ({}),
    getElementsByTagName: () => [{
      parentNode: {
        insertBefore: node => insertedScripts.push(node)
      }
    }],
    head: { appendChild: node => insertedScripts.push(node) }
  }
  const window = {
    Cookiebot: { consent: { marketing } },
    URL,
    crypto: { randomUUID: () => '550e8400-e29b-41d4-a716-446655440000' },
    dataLayer: [],
    document,
    location: new URL(
      'https://utekos.no/produkter/utekos-techdown?fbclid=click-1'
    ),
    setInterval: handler => {
      intervals.push(handler)
      return intervals.length
    },
    setTimeout: () => 1
  }

  window.window = window

  return {
    context: vm.createContext({ document, window }),
    insertedScripts,
    intervals,
    window
  }
}

function queuedCalls(window) {
  return JSON.parse(
    JSON.stringify(
      (window.fbq?.queue ?? []).map(call => Array.from(call))
    )
  )
}

test('requires current marketing consent', () => {
  const runtime = createRuntime({ marketing: false })
  const listeners = []
  runtime.window.addEventListener = (name, handler) => {
    listeners.push([name, handler])
  }
  runtime.window.dataLayer.push(canonicalEvent('page_view', 'event-1'))

  vm.runInContext(script, runtime.context)

  assert.equal(runtime.window.fbq, undefined)
  assert.deepEqual(runtime.insertedScripts, [])
  assert.deepEqual(
    listeners.map(([name]) => name).sort(),
    ['CookiebotOnAccept', 'CookiebotOnConsentReady']
  )
})

test('installs pixel without waiting for _fbp cookie', () => {
  const runtime = createRuntime({ marketing: true })
  runtime.window.document.cookie =
    'utekos_external_id=anon_550e8400-e29b-41d4-a716-446655440000'
  runtime.window.location = new URL('https://utekos.no/produkter')
  runtime.window.dataLayer.push({
    event: 'page_view',
    event_id: 'page-no-fbp',
    canonical_event: {
      event_id: 'page-no-fbp',
      event_name: 'page_view',
      page_url: 'https://utekos.no/produkter',
      custom_data: {},
      consent: { marketing: 'granted' }
    }
  })

  vm.runInContext(script, runtime.context)

  assert.equal(typeof runtime.window.fbq, 'function')
  assert.equal(runtime.window.__utekosMetaPixelState.initialized, true)
  assert.equal(runtime.insertedScripts.length, 1)
  assert.equal(
    runtime.insertedScripts[0].src,
    'https://connect.facebook.net/en_US/fbevents.js'
  )
  assert.deepEqual(
    queuedCalls(runtime.window)
      .filter(call => call[0] === 'trackSingle')
      .map(call => [call[2], call[4].eventID]),
    [['PageView', 'page-no-fbp']]
  )
})

test('dispatches canonical events added after the app bridge loads', () => {
  const runtime = createRuntime({ marketing: true })

  vm.runInContext(publicScript, runtime.context)
  runtime.window.dataLayer.push(canonicalEvent('page_view', 'future-page'))
  runtime.intervals[0]()

  assert.deepEqual(
    queuedCalls(runtime.window)
      .filter(call => call[0] === 'trackSingle')
      .map(call => [call[2], call[4].eventID]),
    [['PageView', 'future-page']]
  )
})

test('does not replay events that occurred before marketing consent', () => {
  const runtime = createRuntime({ marketing: false })
  runtime.window.addEventListener = () => {}

  vm.runInContext(publicScript, runtime.context)
  runtime.window.dataLayer.push(canonicalEvent('page_view', 'before-consent'))
  runtime.intervals[0]()

  runtime.window.Cookiebot.consent.marketing = true
  runtime.intervals[0]()
  runtime.window.dataLayer.push(canonicalEvent('page_view', 'after-consent'))
  runtime.intervals[0]()

  assert.deepEqual(
    queuedCalls(runtime.window)
      .filter(call => call[0] === 'trackSingle')
      .map(call => [call[2], call[4].eventID]),
    [['PageView', 'after-consent']]
  )
})

test(
  'uses trackSingleCustom for Meta custom events and preserves eventID',
  () => {
    const runtime = createRuntime()

    runtime.window.dataLayer.push(
      canonicalEvent('page_view', 'page-event'),
      canonicalEvent('scroll_depth', 'scroll-event', {
        threshold: 50,
        percent_scrolled: 50,
        document_height: 2400
      })
    )

    vm.runInContext(script, runtime.context)

    const calls = queuedCalls(runtime.window)
    const standardEventCalls = calls.filter(
      call => call[0] === 'trackSingle'
    )
    const customEventCalls = calls.filter(
      call => call[0] === 'trackSingleCustom'
    )

    assert.deepEqual(
      standardEventCalls.map(call => [call[2], call[4].eventID]),
      [['PageView', 'page-event']]
    )
    assert.deepEqual(
      customEventCalls.map(call => [call[2], call[4].eventID]),
      [['LandingScrollDepth', 'scroll-event']]
    )
    assert.deepEqual(customEventCalls[0][3], {
      threshold: 50,
      percent_scrolled: 50,
      document_height: 2400
    })
  }
)

test('initializes once and sends canonical Meta events with CAPI event IDs', () => {
  const runtime = createRuntime()
  const commerce = {
    currency: 'NOK',
    gross_value: 1790,
    tax_value: 358,
    value: 1432,
    items: [{
      variant_id: 'gid://shopify/ProductVariant/47123456789012',
      item_name: 'Utekos TechDown',
      item_category: 'Uteklær',
      quantity: 1,
      gross_unit_price: 1790
    }]
  }

  runtime.window.dataLayer.push(
    canonicalEvent('page_view', 'page-event'),
    canonicalEvent('view_item_list', 'list-event', {
      ...commerce,
      impression_sequence: 1,
      item_list_id: 'all_products',
      item_list_name: 'Alle produkter',
      total_item_count: 1
    }),
    canonicalEvent('view_item', 'view-event', commerce),
    canonicalEvent('select_item', 'select-event', commerce),
    canonicalEvent('add_to_wishlist', 'wishlist-event', commerce),
    canonicalEvent('add_to_cart', 'cart-event', commerce),
    canonicalEvent('remove_from_cart', 'remove-cart-event', commerce),
    canonicalEvent('view_cart', 'view-cart-event', commerce),
    canonicalEvent('begin_checkout', 'checkout-event', commerce),
    canonicalEvent('search', 'search-event', { search_term: 'utekos' }),
    canonicalEvent('scroll_depth', 'scroll-depth-event', {
      threshold: 50,
      percent_scrolled: 50,
      document_height: 2400
    }),
    canonicalEvent('view_category', 'view-category-event', {
      category_id: 'produkter',
      category_name: 'Kolleksjonen',
      view_sequence: 1
    }),
    canonicalEvent('hero_interact', 'hero-interact-event', {
      cta_id: 'read_more_hero',
      destination_path: '/skreddersy-varmen',
      click_sequence: 1
    }),
    canonicalEvent('interact_with_accordion', 'accordion-event', {
      ...commerce,
      accordion_id: 'materials',
      accordion_title: 'Materialer',
      interaction_sequence: 1,
      interaction_type: 'open'
    }),
    canonicalEvent('open_quick_view', 'quick-view-event', {
      ...commerce,
      open_sequence: 1,
      source_surface: 'homepage_techdown_campaign'
    }),
    canonicalEvent('generate_lead', 'lead-event', { currency: 'NOK', value: 1 })
  )

  vm.runInContext(script, runtime.context)
  vm.runInContext(script, runtime.context)

  const calls = queuedCalls(runtime.window)
  const configCalls = calls.filter(call => call[0] === 'set')
  const initCalls = calls.filter(call => call[0] === 'init')
  const standardEventCalls = calls.filter(
    call => call[0] === 'trackSingle'
  )
  const customEventCalls = calls.filter(
    call => call[0] === 'trackSingleCustom'
  )

  assert.deepEqual(configCalls, [
    ['set', 'autoConfig', false, '1092362672918571']
  ])
  assert.equal(initCalls.length, 1)
  assert.deepEqual(initCalls[0], [
    'init',
    '1092362672918571',
    { external_id: 'anon_550e8400-e29b-41d4-a716-446655440000' }
  ])
  assert.deepEqual(
    standardEventCalls.map(call => [call[2], call[4].eventID]),
    [
      ['PageView', 'page-event'],
      ['ViewContent', 'view-event'],
      ['AddToWishlist', 'wishlist-event'],
      ['AddToCart', 'cart-event'],
      ['InitiateCheckout', 'checkout-event'],
      ['Search', 'search-event'],
      ['Lead', 'lead-event']
    ]
  )
  assert.deepEqual(
    customEventCalls.map(call => [call[2], call[4].eventID]),
    [
      ['ViewItemList', 'list-event'],
      ['SelectItem', 'select-event'],
      ['RemoveFromCart', 'remove-cart-event'],
      ['ViewCart', 'view-cart-event'],
      ['LandingScrollDepth', 'scroll-depth-event'],
      ['ViewCategory', 'view-category-event'],
      ['HeroInteract', 'hero-interact-event'],
      ['InteractWithAccordion', 'accordion-event'],
      ['OpenQuickView', 'quick-view-event']
    ]
  )
  assert.deepEqual(
    standardEventCalls.find(call => call[2] === 'ViewContent')?.[3],
    {
      content_ids: ['47123456789012'],
      contents: [{ id: '47123456789012', quantity: 1, item_price: 1790 }],
      content_type: 'product',
      num_items: 1,
      currency: 'NOK',
      value: 1790,
      content_name: 'Utekos TechDown',
      content_category: 'Uteklær',
      gross_value: 1790,
      tax_value: 358,
      net_value: 1432
    }
  )
  assert.deepEqual(
    customEventCalls.find(call => call[2] === 'ViewItemList')?.[3],
    {
      content_ids: ['47123456789012'],
      contents: [{ id: '47123456789012', quantity: 1, item_price: 1790 }],
      content_type: 'product',
      num_items: 1,
      currency: 'NOK',
      value: 1790,
      content_name: 'Utekos TechDown',
      content_category: 'Uteklær',
      gross_value: 1790,
      impression_sequence: 1,
      item_list_id: 'all_products',
      item_list_name: 'Alle produkter',
      tax_value: 358,
      total_item_count: 1,
      net_value: 1432
    }
  )
  assert.deepEqual(
    customEventCalls.find(call => call[2] === 'LandingScrollDepth')?.[3],
    {
      threshold: 50,
      percent_scrolled: 50,
      document_height: 2400
    }
  )
  assert.deepEqual(
    customEventCalls.find(call => call[2] === 'ViewCategory')?.[3],
    {
      content_category: 'produkter',
      content_name: 'Kolleksjonen',
      category_id: 'produkter',
      category_name: 'Kolleksjonen',
      view_sequence: 1
    }
  )
  assert.deepEqual(
    customEventCalls.find(call => call[2] === 'HeroInteract')?.[3],
    {
      content_name: 'read_more_hero',
      content_category: '/skreddersy-varmen',
      cta_id: 'read_more_hero',
      destination_path: '/skreddersy-varmen',
      click_sequence: 1
    }
  )
  assert.equal(runtime.insertedScripts.length, 1)
  assert.equal(
    runtime.insertedScripts[0].src,
    'https://connect.facebook.net/en_US/fbevents.js'
  )
})

test('rejects mismatched IDs and events from a different page', () => {
  const runtime = createRuntime()
  const mismatched = canonicalEvent('page_view', 'browser-event')
  mismatched.canonical_event.event_id = 'server-event'
  const differentPage = canonicalEvent('page_view', 'other-page')
  differentPage.canonical_event.page_url = 'https://utekos.no/kampanje/julegaver'

  runtime.window.dataLayer.push(mismatched, differentPage)
  vm.runInContext(script, runtime.context)

  assert.deepEqual(
    queuedCalls(runtime.window).filter(call => call[0] === 'trackSingle'),
    []
  )
})

test('omits currency and value when currency is empty or non-ISO', () => {
  const runtime = createRuntime()
  const items = [{
    variant_id: 'gid://shopify/ProductVariant/47123456789012',
    item_name: 'Utekos TechDown',
    item_category: 'Uteklær',
    quantity: 1,
    gross_unit_price: 1790
  }]

  runtime.window.dataLayer.push(
    canonicalEvent('view_item', 'empty-currency', {
      currency: '',
      gross_value: 1790,
      items
    }),
    canonicalEvent('view_item', 'invalid-currency', {
      currency: 'NO',
      gross_value: 1790,
      items
    }),
    canonicalEvent('view_item', 'normalized-lowercase', {
      currency: 'nok',
      gross_value: 1790,
      items
    }),
    canonicalEvent('view_item', 'value-without-currency', {
      gross_value: 1790,
      items
    }),
    canonicalEvent('generate_lead', 'lead-empty-currency', {
      currency: '',
      value: 1
    })
  )

  vm.runInContext(script, runtime.context)

  const eventCalls = queuedCalls(runtime.window)
    .filter(call => call[0] === 'trackSingle')

  assert.equal(eventCalls.length, 5)

  for (const call of [eventCalls[0], eventCalls[1], eventCalls[3]]) {
    assert.equal('currency' in call[3], false)
    assert.equal('value' in call[3], false)
    assert.deepEqual(call[3].content_ids, ['47123456789012'])
  }

  assert.equal(eventCalls[2][3].currency, 'NOK')
  assert.equal(eventCalls[2][3].value, 1790)
  assert.deepEqual(eventCalls[4][3], {})
})
