import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE_URL =
  process.env.META_BC_DEDUPE_BASE_URL ?? 'https://utekos.no'
const PRODUCT_PATH =
  process.env.META_BC_DEDUPE_PRODUCT_PATH ??
  '/produkter/utekos-techdown'
const TIMEOUT_MS = 60_000
const WAIT_MS = 45_000
const OPENBRIDGE_HOSTS = new Set([
  'signals.utekos.no',
  'mpc2-prod-25-is5qnl632q-wl.a.run.app',
  '5z-2b6b7616f94640c2840d1841e1ac24c3.ecs.us-east-1.on.aws'
])
const ARTIFACT_PATH =
  process.env.META_BC_DEDUPE_ARTIFACT ??
  '/tmp/bc-meta-dedupe-smoke.json'

function isFacebookPixel(url) {
  try {
    const parsed = new URL(url)
    return (
      parsed.hostname === 'www.facebook.com' &&
      (parsed.pathname === '/tr' || parsed.pathname === '/tr/')
    )
  } catch {
    return false
  }
}

function isOpenBridge(url) {
  try {
    return OPENBRIDGE_HOSTS.has(new URL(url).hostname)
  } catch {
    return false
  }
}

function parseMultipartBody(body) {
  if (!body?.startsWith('--')) return {}

  const firstLineEnd = body.indexOf('\r\n')
  if (firstLineEnd < 0) return {}

  const delimiter = body.slice(0, firstLineEnd)
  const fields = {}

  for (const part of body.split(delimiter)) {
    const name = part.match(/name="([^"]+)"/)?.[1]
    const valueStart = part.indexOf('\r\n\r\n')

    if (!name || valueStart < 0) continue

    fields[name] = part
      .slice(valueStart + 4)
      .replace(/\r\n--?\r?\n?$/, '')
      .replace(/\r\n$/, '')
  }

  return fields
}

function parseFacebookEvent(request) {
  const url = new URL(request.url)
  const queryFields = Object.fromEntries(url.searchParams.entries())
  const bodyFields = parseMultipartBody(request.postData)
  const fields = { ...queryFields, ...bodyFields }

  return {
    contentIds: fields['cd[content_ids]'] ?? null,
    contentName: fields['cd[content_name]'] ?? null,
    contentType: fields['cd[content_type]'] ?? null,
    currency: fields['cd[currency]'] ?? null,
    eventId: fields.eid ?? null,
    eventName: fields.ev ?? null,
    externalIdHash: fields['ud[external_id]'] ?? null,
    fbc: fields.fbc ?? null,
    fbp: fields.fbp ?? null,
    pageUrl: fields.dl ?? null,
    value: fields['cd[value]'] ?? null
  }
}

function parseOpenBridgeEvent(request) {
  try {
    const body = JSON.parse(request.postData ?? '')

    return {
      customData: body.custom_data ?? {},
      eventId: body.event_id ?? null,
      eventName: body.event_name ?? null,
      externalIdHash:
        body['fb.advanced_matching']?.external_id ?? null,
      fbc: body['fb.clickID'] ?? null,
      fbp: body['fb.fbp'] ?? null,
      pageUrl: body.website_context?.location ?? null
    }
  } catch {
    return null
  }
}

async function acceptAllConsent(page) {
  const selectors = [
    '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
    '#CybotCookiebotDialogBodyButtonAccept',
    'button:has-text("Tillat alle")',
    'button:has-text("Godta alle")',
    'button:has-text("Accept all")'
  ]

  for (const selector of selectors) {
    const button = page.locator(selector).first()

    if (
      await button
        .isVisible({ timeout: 2_000 })
        .catch(() => false)
    ) {
      await button.click()
      return selector
    }
  }

  throw new Error('Cookiebot accept-all button was not visible')
}

async function waitUntil(predicate, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (await predicate()) return
    await new Promise(resolve => setTimeout(resolve, 250))
  }

  throw new Error(`Timed out waiting for ${label}`)
}

async function main() {
  const browser = await chromium.launch({
    args: ['--disable-blink-features=AutomationControlled'],
    headless: true
  })
  const majorVersion = browser.version().split('.')[0]
  const userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    `Chrome/${majorVersion}.0.0.0 Safari/537.36`
  const context = await browser.newContext({
    locale: 'nb-NO',
    timezoneId: 'Europe/Oslo',
    userAgent
  })
  const page = await context.newPage()
  const fbclid =
    `codex_fbclid_bc_dedupe_${randomUUID().replaceAll('-', '')}`
  const url = new URL(PRODUCT_PATH, BASE_URL)
  url.searchParams.set('fbclid', fbclid)

  const facebookRequests = []
  const openBridgeRequests = []
  const facebookResponses = []
  const openBridgeResponses = []
  const firstPartyPosts = []
  const blockedNavigations = []

  // Abort Shopify checkout document navigations so dataLayer remains
  // readable after begin_checkout is reported.
  await page.route('**/*', async route => {
    const request = route.request()
    const requestUrl = request.url()
    const isCheckoutNav =
      request.resourceType() === 'document' &&
      /kasse\.utekos\.no|checkout\.shopify|myshopify\.com\/checkouts|shopify\.com\/checkouts/.test(
        requestUrl
      )

    if (isCheckoutNav) {
      blockedNavigations.push(requestUrl)
      return route.abort()
    }

    return route.continue()
  })

  page.on('request', request => {
    const requestUrl = request.url()

    if (isFacebookPixel(requestUrl)) {
      facebookRequests.push({
        postData: request.postData(),
        url: requestUrl
      })
    }

    if (isOpenBridge(requestUrl)) {
      openBridgeRequests.push({
        postData: request.postData(),
        url: requestUrl
      })
    }

    if (
      request.method() === 'POST' &&
      /\/api\/(analytics|tracking|events)/.test(requestUrl)
    ) {
      firstPartyPosts.push({
        postData: request.postData(),
        url: requestUrl
      })
    }
  })

  page.on('response', response => {
    const responseUrl = response.url()

    if (isFacebookPixel(responseUrl)) {
      facebookResponses.push({
        status: response.status(),
        url: responseUrl
      })
    }

    if (isOpenBridge(responseUrl)) {
      openBridgeResponses.push({
        status: response.status(),
        url: responseUrl
      })
    }
  })

  let report

  try {
    const navigation = await page.goto(url.toString(), {
      timeout: TIMEOUT_MS,
      waitUntil: 'domcontentloaded'
    })

    await page.waitForTimeout(3_000)
    const consentSelector = await acceptAllConsent(page)

    await page.waitForFunction(
      () => globalThis.Cookiebot?.consent?.marketing === true,
      undefined,
      { timeout: 15_000 }
    )
    await page.waitForFunction(
      () =>
        document.cookie.includes('_fbp=') &&
        document.cookie.includes('utekos_external_id='),
      undefined,
      { timeout: 20_000 }
    )
    await page.waitForTimeout(4_000)

    const addButton = page
      .locator('[data-track="ModalAddToCart"]')
      .first()

    if (!(await addButton.isVisible({ timeout: 10_000 }))) {
      throw new Error('ModalAddToCart button not visible')
    }

    await addButton.click()

    await waitUntil(
      async () =>
        page.evaluate(
          () =>
            (globalThis.dataLayer ?? []).some(
              entry =>
                entry &&
                typeof entry === 'object' &&
                entry.event === 'add_to_cart'
            )
        ),
      WAIT_MS,
      'dataLayer add_to_cart'
    )

    const checkoutLink = page
      .locator('a[aria-label*="Gå til kassen"]')
      .first()
    await checkoutLink.waitFor({ state: 'visible', timeout: 15_000 })
    const bridgeRuntime = await page.evaluate(() => ({
      independentBridgePresent: Boolean(
        globalThis.cbq || globalThis.__utekosSignalsGatewayState
      ),
      independentSdkLoaded: performance
        .getEntriesByType('resource')
        .some(entry =>
          entry.name.includes('signals.utekos.no/sdk/')
        )
    }))
    let dataLayerEvents = []
    await checkoutLink.click({ force: true })

    await waitUntil(
      async () => {
        const events = await page
          .evaluate(() =>
            (globalThis.dataLayer ?? [])
              .filter(
                entry =>
                  entry &&
                  typeof entry === 'object' &&
                  entry.event === 'begin_checkout'
              )
              .map(entry => ({
                browserId: entry.canonical_event?.browser_id ?? null,
                canonicalEventId:
                  entry.canonical_event?.event_id ?? null,
                clickId: entry.canonical_event?.click_id ?? null,
                contentIds:
                  entry.canonical_event?.custom_data?.items?.map(
                    item => item.variant_id
                  ) ?? null,
                currency:
                  entry.canonical_event?.custom_data?.currency ?? null,
                eventId: entry.event_id ?? null,
                grossValue:
                  entry.canonical_event?.custom_data?.gross_value ??
                  null,
                itemName:
                  entry.canonical_event?.custom_data?.items?.[0]
                    ?.item_name ?? null,
                value:
                  entry.canonical_event?.custom_data?.value ?? null
              }))
          )
          .catch(() => [])

        if (events.length === 0) return false

        dataLayerEvents = events
        return true
      },
      WAIT_MS,
      'dataLayer begin_checkout'
    )

    await waitUntil(
      () => {
        const facebook = facebookRequests
          .map(parseFacebookEvent)
          .filter(event => event.eventName === 'InitiateCheckout')
        const openBridge = openBridgeRequests
          .map(parseOpenBridgeEvent)
          .filter(event => event?.eventName === 'InitiateCheckout')

        return facebook.length >= 1 && openBridge.length >= 1
      },
      WAIT_MS,
      'Meta Pixel + managed Signals Gateway InitiateCheckout'
    )

    await page.waitForTimeout(2_000)

    const facebookEvents = facebookRequests
      .map(parseFacebookEvent)
      .filter(event => event.eventName === 'InitiateCheckout')
    const openBridgeEvents = openBridgeRequests
      .map(parseOpenBridgeEvent)
      .filter(event => event?.eventName === 'InitiateCheckout')
    const openBridgeHosts = [
      ...new Set(
        openBridgeRequests.map(request => new URL(request.url).hostname)
      )
    ].sort()
    let postEventId = null
    for (const post of firstPartyPosts) {
      try {
        const body = JSON.parse(post.postData ?? '')
        const eventName =
          body.event ??
          body.event_name ??
          body.canonical_event?.event_name
        const eventId =
          body.event_id ?? body.canonical_event?.event_id ?? null

        if (eventName === 'begin_checkout' && eventId) {
          postEventId = eventId
          break
        }
      } catch {
        // ignore non-JSON posts
      }
    }

    const primary = dataLayerEvents[0] ?? null
    const sharedEventId =
      primary?.eventId ??
      postEventId ??
      facebookEvents[0]?.eventId ??
      null
    const facebookMatch = facebookEvents.filter(
      event => event.eventId === sharedEventId
    )
    const openBridgeMatch = openBridgeEvents.filter(
      event => event?.eventId === sharedEventId
    )
    const checks = {
      dataLayerOrPostPresent:
        dataLayerEvents.length >= 1 || Boolean(postEventId),
      dataLayerInternalParity:
        dataLayerEvents.length === 0 ||
        (Boolean(primary?.eventId) &&
          primary?.eventId === primary?.canonicalEventId),
      facebookPresent: facebookEvents.length >= 1,
      facebookSharedId: facebookMatch.length >= 1,
      managedSignalsGatewayPresent: openBridgeEvents.length >= 1,
      managedSignalsGatewaySharedId: openBridgeMatch.length >= 1,
      noIndependentSignalsGatewayBridge:
        bridgeRuntime.independentBridgePresent === false &&
        bridgeRuntime.independentSdkLoaded === false &&
        !openBridgeHosts.includes('signals.utekos.no'),
      postSharedId:
        Boolean(postEventId) && postEventId === sharedEventId,
      singlePrimaryUuid: Boolean(sharedEventId)
    }

    report = {
      baseUrl: BASE_URL,
      blockedNavigations,
      bridgeRuntime,
      browserVersion: majorVersion,
      checks,
      consentSelector,
      dataLayerEvents,
      facebookEvents,
      facebookMatch,
      facebookStatuses: facebookResponses.map(
        response => response.status
      ),
      fbclid,
      firstPartyPostCount: firstPartyPosts.length,
      navigationStatus: navigation?.status() ?? null,
      ok:
        navigation?.status() === 200 &&
        Object.values(checks).every(Boolean),
      openBridgeEvents,
      openBridgeHosts,
      openBridgeMatch,
      openBridgeRequestCount: openBridgeRequests.length,
      openBridgeStatuses: openBridgeResponses.map(
        response => response.status
      ),
      postEventId,
      productPath: PRODUCT_PATH,
      sharedEventId,
      url: page.url(),
      userAgent
    }
  } finally {
    await context.close()
    await browser.close()
  }

  writeFileSync(ARTIFACT_PATH, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  console.error(`Wrote ${ARTIFACT_PATH}`)

  if (!report.ok) process.exitCode = 1
}

main().catch(error => {
  console.error(
    error instanceof Error ? error.stack : String(error)
  )
  process.exitCode = 1
})
