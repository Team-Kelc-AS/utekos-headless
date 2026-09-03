import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const BASE_URL =
  process.env.META_ATC_DEDUPE_BASE_URL ?? 'https://utekos.no'
const LIST_PATH = process.env.META_ATC_PRODUCTCARD_PATH ?? '/'
const TIMEOUT_MS = 60_000
const ATC_WAIT_MS = 45_000
const OPENBRIDGE_HOSTS = new Set([
  'signals.utekos.no',
  'mpc2-prod-25-is5qnl632q-wl.a.run.app',
  '5z-2b6b7616f94640c2840d1841e1ac24c3.ecs.us-east-1.on.aws'
])
const ARTIFACT_PATH =
  process.env.META_ATC_PRODUCTCARD_ARTIFACT ??
  '/tmp/atc-productcard-coverage-smoke.json'

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
  const queryFields = Object.fromEntries(
    url.searchParams.entries()
  )
  const bodyFields = parseMultipartBody(request.postData)
  const fields = { ...queryFields, ...bodyFields }

  return {
    eventId: fields.eid ?? null,
    eventName: fields.ev ?? null
  }
}

function parseOpenBridgeEvent(request) {
  try {
    const body = JSON.parse(request.postData ?? '')

    return {
      eventId: body.event_id ?? null,
      eventName: body.event_name ?? null
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
  const fbclid = `codex_fbclid_atc_productcard_${randomUUID().replaceAll('-', '')}`
  const url = new URL(LIST_PATH, BASE_URL)
  url.searchParams.set('fbclid', fbclid)

  const facebookRequests = []
  const openBridgeRequests = []
  const firstPartyPosts = []

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

    await page.waitForTimeout(3_000)

    // Product cards live in homepage carousels; scroll until the CTA is in view.
    for (let i = 0; i < 8; i += 1) {
      const visible = await page
        .locator(
          '[data-track="ProductCardFooterAddToCartClick"]'
        )
        .first()
        .isVisible()
        .catch(() => false)

      if (visible) break

      await page.evaluate(() => window.scrollBy(0, 900))
      await page.waitForTimeout(500)
    }

    const addButton = page
      .locator('[data-track="ProductCardFooterAddToCartClick"]')
      .first()

    if (!(await addButton.isVisible({ timeout: 15_000 }))) {
      throw new Error(
        'ProductCardFooterAddToCartClick button not visible'
      )
    }

    await addButton.scrollIntoViewIfNeeded()
    await addButton.click({ force: true })

    await waitUntil(
      async () => {
        const count = await page.evaluate(
          () =>
            (globalThis.dataLayer ?? []).filter(
              entry =>
                entry &&
                typeof entry === 'object' &&
                entry.event === 'add_to_cart'
            ).length
        )
        return count >= 1
      },
      ATC_WAIT_MS,
      'dataLayer add_to_cart from ProductCard'
    )

    await waitUntil(
      () => {
        const facebook = facebookRequests
          .map(parseFacebookEvent)
          .filter(event => event.eventName === 'AddToCart')

        return facebook.length >= 1
      },
      ATC_WAIT_MS,
      'Meta Pixel AddToCart from ProductCard'
    )

    await page.waitForTimeout(2_000)

    const dataLayerEvents = await page.evaluate(() =>
      (globalThis.dataLayer ?? [])
        .filter(
          entry =>
            entry &&
            typeof entry === 'object' &&
            entry.event === 'add_to_cart'
        )
        .map(entry => ({
          canonicalEventId:
            entry.canonical_event?.event_id ?? null,
          eventId: entry.event_id ?? null,
          itemName:
            entry.canonical_event?.custom_data?.items?.[0]
              ?.item_name ?? null,
          productHandle:
            entry.canonical_event?.custom_data?.items?.[0]
              ?.product_handle ?? null
        }))
    )

    const facebookEvents = facebookRequests
      .map(parseFacebookEvent)
      .filter(event => event.eventName === 'AddToCart')
    const openBridgeEvents = openBridgeRequests
      .map(parseOpenBridgeEvent)
      .filter(event => event?.eventName === 'AddToCart')

    const primary = dataLayerEvents[0] ?? null
    const sharedEventId = primary?.eventId ?? null
    const facebookMatch = facebookEvents.filter(
      event => event.eventId === sharedEventId
    )
    let postEventId = null
    let postPath = null
    for (const post of firstPartyPosts) {
      try {
        const body = JSON.parse(post.postData ?? '')
        const eventName =
          body.event ??
          body.event_name ??
          body.canonical_event?.event_name
        const eventId =
          body.event_id ?? body.canonical_event?.event_id ?? null

        if (eventName === 'add_to_cart' && eventId) {
          postEventId = eventId
          postPath = new URL(post.url).pathname
          break
        }
      } catch {
        // ignore non-JSON posts
      }
    }

    const checks = {
      dataLayerPresent: dataLayerEvents.length >= 1,
      facebookPresent: facebookEvents.length >= 1,
      facebookSharedId: facebookMatch.length >= 1,
      openBridgeAbsent: openBridgeEvents.length === 0,
      postPresent: Boolean(postEventId),
      postPathIsAddToCart:
        postPath === '/api/events/add-to-cart',
      postSharedId: postEventId === sharedEventId
    }

    report = {
      baseUrl: BASE_URL,
      browserVersion: majorVersion,
      checks,
      consentSelector,
      dataLayerEvents,
      facebookEvents,
      facebookMatch,
      fbclid,
      listPath: LIST_PATH,
      navigationStatus: navigation?.status() ?? null,
      ok:
        navigation?.status() === 200 &&
        Object.values(checks).every(Boolean),
      openBridgeEvents,
      postEventId,
      postPath,
      sharedEventId,
      source: 'ProductCardFooterAddToCartClick',
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
