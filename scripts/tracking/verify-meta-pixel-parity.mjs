import { createHash, randomUUID } from 'node:crypto'
import { chromium } from 'playwright'

const BASE_URL =
  process.env.META_PIXEL_SMOKE_BASE_URL ?? 'https://utekos.no'
const PIXEL_ID = '1092362672918571'
const TIMEOUT_MS = 45_000
const META_COOKIE_NAMES = [
  '_fbc',
  '_fbp',
  'utekos_external_id'
]
const OPENBRIDGE_HOSTS = new Set([
  'mpc2-prod-25-is5qnl632q-wl.a.run.app',
  '5z-2b6b7616f94640c2840d1841e1ac24c3.ecs.us-east-1.on.aws'
])
const SURFACES = [
  {
    name: 'homepage',
    path: '/',
    awayPath: '/om-oss',
    expectedEvents: ['PageView']
  },
  {
    name: 'product',
    path: '/produkter/utekos-techdown',
    awayPath: '/',
    expectedEvents: ['PageView', 'ViewContent']
  },
  {
    name: 'campaign',
    path: '/skreddersy-varmen',
    awayPath: '/',
    expectedEvents: ['PageView', 'ViewContent']
  }
]
const CANONICAL_EVENT_NAMES = {
  PageView: 'page_view',
  ViewContent: 'view_item'
}

function isMetaTransport(rawUrl) {
  const url = new URL(rawUrl)

  return (
    url.hostname === 'connect.facebook.net' ||
    (url.hostname === 'www.facebook.com' && url.pathname === '/tr/') ||
    OPENBRIDGE_HOSTS.has(url.hostname)
  )
}

function isFacebookTrRequest(rawUrl) {
  try {
    const url = new URL(rawUrl)
    return (
      url.hostname === 'www.facebook.com' && url.pathname === '/tr/'
    )
  } catch {
    return false
  }
}

function isMetaCspViolation(message) {
  const blockedUrl = message.match(
    /'(https:\/\/[^']+)' violates/
  )?.[1]

  if (!blockedUrl) return false

  try {
    return isMetaTransport(blockedUrl)
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
    eventId: fields.eid ?? null,
    eventName: fields.ev ?? null,
    externalIdHash: fields['ud[external_id]'] ?? null,
    fbc: fields.fbc ?? null,
    fbp: fields.fbp ?? null,
    pageUrl: fields.dl ?? null,
    contentIds: fields['cd[content_ids]'] ?? null,
    currency: fields['cd[currency]'] ?? null,
    value: fields['cd[value]'] ?? null
  }
}

function parseOpenBridgeEvent(request) {
  try {
    const body = JSON.parse(request.postData ?? '')

    return {
      eventId: body.event_id ?? null,
      eventName: body.event_name ?? null,
      externalIdHash:
        body['fb.advanced_matching']?.external_id ?? null,
      fbc: body['fb.clickID'] ?? null,
      fbp: body['fb.fbp'] ?? null,
      pageUrl: body.website_context?.location ?? null,
      customData: body.custom_data ?? {}
    }
  } catch {
    return null
  }
}

function cookieByName(cookies, name) {
  return cookies.find(cookie => cookie.name === name)
}

function hasExpectedLifetime(cookie, expectedDays) {
  if (!cookie || cookie.expires <= 0) return false

  const remainingDays =
    (cookie.expires - Date.now() / 1000) / (60 * 60 * 24)

  return (
    remainingDays >= expectedDays - 1 &&
    remainingDays <= expectedDays + 1
  )
}

function hasCanonicalEventParity(
  expectedEvents,
  dataLayerEvents,
  facebookEvents,
  openBridgeEvents
) {
  return expectedEvents.every(metaEventName => {
    const canonicalName = CANONICAL_EVENT_NAMES[metaEventName]
    const canonical = dataLayerEvents.filter(
      event => event.event === canonicalName
    )
    const facebook = facebookEvents.filter(
      event => event.eventName === metaEventName
    )
    const openBridge = openBridgeEvents.filter(
      event => event?.eventName === metaEventName
    )

    return (
      canonical.length === 1 &&
      canonical[0].eventId === canonical[0].canonicalEventId &&
      facebook.length === 1 &&
      facebook[0].eventId === canonical[0].eventId &&
      openBridge.length === 1 &&
      openBridge[0]?.eventId === canonical[0].eventId
    )
  })
}

function latestCanonicalEventsByName(events) {
  const latest = new Map()

  for (const event of events) {
    latest.set(event.event, event)
  }

  return [...latest.values()]
}

function isCanonicalEventId(eventId) {
  return (
    typeof eventId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      eventId
    )
  )
}

function requestMatchesPath(pageUrl, pathname) {
  if (typeof pageUrl !== 'string') return false

  try {
    return new URL(pageUrl).pathname === pathname
  } catch {
    return false
  }
}

function isIgnorableConsoleError(message) {
  return (
    (message.includes('report-only Content Security Policy') &&
      message.includes('frame-ancestors \'none\'')) ||
    message.includes('Unsupported Summarizer API languages')
  )
}

const ALLOWED_SIDE_EFFECT_EVENTS = new Set([
  'LandingScrollDepth'
])

function selectParityFacebookEvents(events, pathname) {
  return events.filter(
    event =>
      requestMatchesPath(event.pageUrl, pathname) &&
      isCanonicalEventId(event.eventId)
  )
}

function selectParityOpenBridgeEvents(events, pathname) {
  return events.filter(
    event =>
      requestMatchesPath(event?.pageUrl, pathname) &&
      isCanonicalEventId(event?.eventId)
  )
}

function hasExpectedFacebookEvents(events, expectedEvents) {
  return expectedEvents.every(
    eventName =>
      events.filter(event => event.eventName === eventName)
        .length === 1
  )
}

function countFacebookTrForPath(requests, pathname, offset = 0) {
  return selectParityFacebookEvents(
    requests
      .slice(offset)
      .filter(request => isFacebookTrRequest(request.url))
      .map(parseFacebookEvent),
    pathname
  ).length
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

async function waitForMarketingConsent(page, timeoutMs = 20_000) {
  await page.waitForFunction(
    () => globalThis.Cookiebot?.consent?.marketing === true,
    undefined,
    { timeout: timeoutMs }
  )
}

async function waitForPixelInitialized(page, timeoutMs = 20_000) {
  await page.waitForFunction(
    () => globalThis.__utekosMetaPixelState?.initialized === true,
    undefined,
    { timeout: timeoutMs }
  )
}

async function waitForPixelTransportReady(page, timeoutMs = 25_000) {
  await page.waitForFunction(
    () => {
      const fbq = globalThis.fbq
      return Boolean(
        globalThis.__utekosMetaPixelState?.initialized === true &&
          fbq?.loaded === true &&
          typeof fbq?.callMethod === 'function' &&
          document.cookie.includes('_fbp=') &&
          document.cookie.includes('_fbc=') &&
          document.cookie.includes('utekos_external_id=')
      )
    },
    undefined,
    { timeout: timeoutMs }
  )
}

async function readCanonicalEventsForPath(page, pathname) {
  return page.evaluate(targetPath => {
    return (globalThis.dataLayer ?? [])
      .filter(
        entry =>
          entry &&
          typeof entry === 'object' &&
          (entry.event === 'page_view' || entry.event === 'view_item')
      )
      .filter(entry => {
        const pageUrl = entry.canonical_event?.page_url
        if (typeof pageUrl !== 'string') return false

        try {
          return new URL(pageUrl).pathname === targetPath
        } catch {
          return false
        }
      })
      .map(entry => ({
        canonicalEventId: entry.canonical_event?.event_id ?? null,
        event: entry.event,
        eventId: entry.event_id ?? null,
        pageUrl: entry.canonical_event?.page_url ?? null,
        raw: entry
      }))
  }, pathname)
}

async function readPixelSentKeys(page) {
  return page.evaluate(
    () => Object.keys(globalThis.__utekosMetaPixelState?.sent ?? {})
  )
}

/**
 * Soft-navigate within the same JS context so Cookiebot marketing
 * consent and the Pixel poller stay live. Production does not replay
 * pre-consent dataLayer entries; full reload races Cookiebot restore.
 *
 * Prefer Next App Router `window.next.router.push` — plain <a>.click()
 * often hard-navigates and remounts the document.
 */
export async function softClientNavigate(page, pathname, searchParams = {}) {
  const navigationMarker = `utekos_meta_smoke_nav_${randomUUID()}`
  const query = new URLSearchParams(searchParams).toString()
  const targetHref = query ? `${pathname}?${query}` : pathname

  const result = await page.evaluate(
    ({ targetPath, targetHref: href, marker }) => {
      const currentQuery = location.search.replace(/^\?/, '')
      const desiredQuery = href.includes('?')
        ? href.slice(href.indexOf('?') + 1)
        : ''
      if (
        location.pathname === targetPath &&
        currentQuery === desiredQuery
      ) {
        return { method: 'noop', soft: true }
      }

      window.__utekosMetaSmokeNavMarker = marker
      const router = window.next?.router

      if (typeof router?.push === 'function') {
        router.push(href)
        return { method: 'next-router-push', soft: true }
      }

      const links = [...document.querySelectorAll('a[href]')]
      const existing = links.find(anchor => {
        const raw = anchor.getAttribute('href')
        if (!raw || raw.startsWith('#')) return false

        try {
          return new URL(raw, location.origin).pathname === targetPath
        } catch {
          return false
        }
      })

      if (existing) {
        existing.click()
        return { method: 'existing-link', soft: true }
      }

      const injected = document.createElement('a')
      injected.href = href
      injected.setAttribute('href', href)
      injected.setAttribute('data-utekos-meta-smoke-nav', marker)
      injected.style.display = 'none'
      document.body.appendChild(injected)
      injected.click()

      return { method: 'injected-link', soft: true }
    },
    {
      marker: navigationMarker,
      targetHref,
      targetPath: pathname
    }
  )

  if (result.method === 'noop') return result

  await page.waitForURL(
    url => {
      try {
        return new URL(url).pathname === pathname
      } catch {
        return false
      }
    },
    { timeout: TIMEOUT_MS }
  )

  const softStillAlive = await page.evaluate(marker => {
    return window.__utekosMetaSmokeNavMarker === marker
  }, navigationMarker)

  if (!softStillAlive) {
    throw new Error(
      `Hard navigation detected while soft-navigating to ${pathname} ` +
        `(method=${result.method}). Smoke requires SPA navigation so ` +
        'pre-consent Cookiebot/Pixel state is preserved.'
    )
  }

  await page.waitForTimeout(2_500)
  return result
}

/**
 * Generate NEW post-consent canonical events for Pixel to dispatch.
 *
 * Full reload races Cookiebot restore vs the Pixel poller. Soft-nav
 * away/back remounts PageView but Next App Router can restore cached
 * product trees so view_item's useRef dedupe suppresses ViewContent.
 * Re-pushing cloned pre-consent entries with fresh UUIDs stays in the
 * same consented JS context and matches the Pixel contract:
 * new dataLayer rows after consent → /tr/.
 */
async function generatePostConsentSurfaceEvents(page, surface, preConsentEvents) {
  const expectedCanonicalNames = surface.expectedEvents.map(
    metaName => CANONICAL_EVENT_NAMES[metaName]
  )

  await page.evaluate(
    ({ expectedCanonicalNames: names, sources }) => {
      const dataLayer = globalThis.dataLayer || []
      globalThis.dataLayer = dataLayer

      for (const name of names) {
        const source = sources.find(entry => entry.event === name)
        if (!source?.raw) {
          throw new Error(
            `Missing pre-consent dataLayer source for ${name}`
          )
        }

        const eventId = crypto.randomUUID()
        const clone = structuredClone(source.raw)
        clone.event_id = eventId
        if (
          clone.canonical_event &&
          typeof clone.canonical_event === 'object'
        ) {
          clone.canonical_event.event_id = eventId
          clone.canonical_event.page_url = location.href
        }
        dataLayer.push(clone)
      }
    },
    {
      expectedCanonicalNames,
      sources: preConsentEvents
    }
  )

  await page.waitForTimeout(1_000)
}

async function waitUntil(predicate, timeoutMs = 20_000, label = 'condition') {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (await predicate()) return
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  throw new Error(`Timed out while waiting for ${label}`)
}

async function verifySurface(browser, userAgent, surface) {
  const context = await browser.newContext({
    locale: 'nb-NO',
    timezoneId: 'Europe/Oslo',
    userAgent
  })
  const page = await context.newPage()
  const requests = []
  const responses = []
  const requestFailures = []
  const consoleErrors = []
  const pageErrors = []
  const metaCspViolations = []
  const fbclid =
    `codex_meta_pixel_${surface.name}_` +
    randomUUID().replaceAll('-', '')
  const url = new URL(surface.path, BASE_URL)
  url.searchParams.set('fbclid', fbclid)

  page.on('request', request => {
    if (!isMetaTransport(request.url())) return

    requests.push({
      method: request.method(),
      postData: request.postData(),
      url: request.url()
    })
  })
  page.on('response', response => {
    if (!isMetaTransport(response.url())) return

    responses.push({
      status: response.status(),
      url: response.url()
    })
  })
  page.on('requestfailed', request => {
    if (!isMetaTransport(request.url())) return

    requestFailures.push({
      error: request.failure()?.errorText ?? 'unknown',
      url: request.url()
    })
  })
  page.on('console', message => {
    const text = message.text()

    if (message.type() === 'error') consoleErrors.push(text)
    if (
      text.includes('Content Security Policy') &&
      isMetaCspViolation(text)
    ) {
      metaCspViolations.push(text)
    }
  })
  page.on('pageerror', error => pageErrors.push(error.message))

  try {
    // Phase A — pre-consent on the target surface
    const navigation = await page.goto(url.toString(), {
      timeout: TIMEOUT_MS,
      waitUntil: 'domcontentloaded'
    })

    await page.waitForTimeout(4_000)

    const beforeCookies = (await context.cookies()).filter(cookie =>
      META_COOKIE_NAMES.includes(cookie.name)
    )
    const beforeMetaRequests = requests.length
    const preConsentEvents = latestCanonicalEventsByName(
      await readCanonicalEventsForPath(page, surface.path)
    )
    const preConsentEventIds = preConsentEvents
      .map(event => event.eventId)
      .filter(Boolean)

    // Phase B — grant marketing consent; pre-consent events must not replay
    const consentSelector = await acceptAllConsent(page)
    await waitForMarketingConsent(page)
    await waitForPixelInitialized(page)
    await waitForPixelTransportReady(page)

    const sentAfterConsent = await readPixelSentKeys(page)
    const facebookTrAfterConsent = countFacebookTrForPath(
      requests,
      surface.path
    )
    const preConsentIdsReplayed = preConsentEventIds.filter(eventId =>
      sentAfterConsent.some(key => key.endsWith(`:${eventId}`))
    )
    const noPreConsentReplay =
      preConsentIdsReplayed.length === 0 &&
      facebookTrAfterConsent === 0

    // Phase C — generate NEW post-consent events via SPA soft navigation
    const postConsentRequestOffset = requests.length
    const postConsentResponseOffset = responses.length
    await generatePostConsentSurfaceEvents(
      page,
      surface,
      preConsentEvents
    )

    await page.waitForFunction(
      names =>
        names.every(name =>
          document.cookie
            .split('; ')
            .some(cookie => cookie.startsWith(`${name}=`))
        ),
      META_COOKIE_NAMES,
      { timeout: 15_000 }
    )
    await waitUntil(
      () => {
        const facebook = selectParityFacebookEvents(
          requests
            .slice(postConsentRequestOffset)
            .filter(request => isFacebookTrRequest(request.url))
            .map(parseFacebookEvent),
          surface.path
        )
        return hasExpectedFacebookEvents(
          facebook,
          surface.expectedEvents
        )
      },
      30_000,
      `Meta /tr/ events (${surface.expectedEvents.join(', ')}) on ${surface.path}`
    )
    await page.waitForTimeout(2_000)

    const cookies = (await context.cookies()).filter(cookie =>
      META_COOKIE_NAMES.includes(cookie.name)
    )
    const fbc = cookieByName(cookies, '_fbc')
    const fbp = cookieByName(cookies, '_fbp')
    const externalId = cookieByName(
      cookies,
      'utekos_external_id'
    )
    const externalIdHash =
      externalId ?
        createHash('sha256')
          .update(externalId.value)
          .digest('hex')
      : null

    // Prefer post-consent event IDs (exclude the pre-consent snapshot).
    const allPathEvents = await readCanonicalEventsForPath(
      page,
      surface.path
    )
    const postConsentDataLayerEvents = latestCanonicalEventsByName(
      allPathEvents.filter(
        event =>
          event.eventId &&
          !preConsentEventIds.includes(event.eventId)
      )
    )
    const dataLayerEvents =
      (postConsentDataLayerEvents.length > 0 ?
        postConsentDataLayerEvents
      : latestCanonicalEventsByName(allPathEvents)
      ).map(entry => {
        const event = { ...entry }
        delete event.raw
        return event
      })

    const postConsentRequests = requests.slice(postConsentRequestOffset)
    const postConsentResponses = responses.slice(
      postConsentResponseOffset
    )
    const facebookEvents = selectParityFacebookEvents(
      postConsentRequests
        .filter(request => isFacebookTrRequest(request.url))
        .map(parseFacebookEvent),
      surface.path
    )
    const openBridgeEvents = selectParityOpenBridgeEvents(
      postConsentRequests
        .filter(request =>
          OPENBRIDGE_HOSTS.has(new URL(request.url).hostname)
        )
        .map(parseOpenBridgeEvent)
        .filter(Boolean),
      surface.path
    )
    const facebookStatuses = postConsentResponses
      .filter(response => isFacebookTrRequest(response.url))
      .map(response => response.status)
    const openBridgeStatuses = postConsentResponses
      .filter(response =>
        OPENBRIDGE_HOSTS.has(new URL(response.url).hostname)
      )
      .map(response => response.status)
    const runtime = await page.evaluate(pixelId => ({
      automaticSetup:
        globalThis.fbq?.instance?.optIns?._opts
          ?.AutomaticSetup?.[pixelId] ?? null,
      initialized: globalThis.__utekosMetaPixelState?.initialized ?? false,
      sent: Object.keys(
        globalThis.__utekosMetaPixelState?.sent ?? {}
      )
    }), PIXEL_ID)
    const fbcParts = fbc?.value.split('.') ?? []
    const fbpParts = fbp?.value.split('.') ?? []
    const unexpectedFacebookEvents = facebookEvents.filter(
      event =>
        !surface.expectedEvents.includes(event.eventName) &&
        !ALLOWED_SIDE_EFFECT_EVENTS.has(event.eventName)
    )
    const actionableConsoleErrors = consoleErrors.filter(
      message => !isIgnorableConsoleError(message)
    )
    const checks = {
      automaticEventsDisabled: runtime.automaticSetup === false,
      canonicalEventParity: hasCanonicalEventParity(
        surface.expectedEvents,
        dataLayerEvents,
        facebookEvents,
        openBridgeEvents
      ),
      cookieAppendix:
        fbcParts.at(-1) === 'AQQCAQMB' &&
        fbpParts.at(-1) === 'AQQCAQMB',
      cookieAttributes:
        cookies.length === 3 &&
        cookies.every(cookie =>
          cookie.path === '/' && cookie.sameSite === 'Lax'
        ) &&
        externalId?.secure === true,
      cookieLifetimes:
        hasExpectedLifetime(fbc, 90) &&
        hasExpectedLifetime(fbp, 90) &&
        hasExpectedLifetime(externalId, 365),
      externalIdHashParity:
        Boolean(externalIdHash) &&
        facebookEvents.every(
          event => event.externalIdHash === externalIdHash
        ) &&
        openBridgeEvents.every(
          event => event?.externalIdHash === externalIdHash
        ),
      fbcParity:
        fbcParts[0] === 'fb' &&
        fbcParts[1] === '1' &&
        fbcParts[3] === fbclid &&
        facebookEvents.every(event => event.fbc === fbc?.value) &&
        openBridgeEvents.every(event => event?.fbc === fbc?.value),
      fbpParity:
        fbpParts[0] === 'fb' &&
        fbpParts[1] === '1' &&
        facebookEvents.every(event => event.fbp === fbp?.value) &&
        openBridgeEvents.every(event => event?.fbp === fbp?.value),
      noConsoleErrors:
        actionableConsoleErrors.length === 0 &&
        pageErrors.length === 0,
      noMetaBeforeConsent:
        beforeCookies.length === 0 && beforeMetaRequests === 0,
      noMetaCspViolations: metaCspViolations.length === 0,
      noPreConsentReplay,
      noUnexpectedPixelEvents:
        unexpectedFacebookEvents.length === 0,
      providerResponses:
        facebookEvents.length === surface.expectedEvents.length &&
        facebookStatuses.length >= facebookEvents.length &&
        facebookStatuses.every(status => status === 200) &&
        openBridgeEvents.length >= surface.expectedEvents.length &&
        openBridgeStatuses.length >= openBridgeEvents.length &&
        openBridgeStatuses.every(status => status === 200)
    }

    return {
      checks,
      consoleErrors,
      consentSelector,
      cookies: cookies.map(cookie => ({
        domain: cookie.domain,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        name: cookie.name,
        path: cookie.path,
        sameSite: cookie.sameSite,
        secure: cookie.secure,
        value: cookie.value
      })),
      dataLayerEvents,
      facebookEvents,
      facebookStatuses,
      fbclid,
      metaCspViolations,
      navigationStatus: navigation?.status() ?? null,
      ok:
        navigation?.status() === 200 &&
        Object.values(checks).every(Boolean),
      openBridgeEvents,
      openBridgeStatuses,
      pageErrors,
      preConsentEventIds,
      preConsentIdsReplayed,
      requestFailures,
      runtime,
      surface: surface.name,
      url: page.url()
    }
  } finally {
    await context.close()
  }
}

async function main() {
  const browser = await chromium.launch({
    args: ['--disable-blink-features=AutomationControlled'],
    // Kasada on utekos.no blocks stock Playwright Chromium from Meta
    // /tr/ + OpenBridge transport; system Chrome passes the challenge.
    channel: 'chrome',
    headless: true
  })
  const majorVersion = browser.version().split('.')[0]
  const userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    `Chrome/${majorVersion}.0.0.0 Safari/537.36`
  const results = []

  try {
    for (const surface of SURFACES) {
      results.push(
        await verifySurface(browser, userAgent, surface)
      )
    }
  } finally {
    await browser.close()
  }

  const report = {
    baseUrl: BASE_URL,
    browserVersion: majorVersion,
    ok: results.every(result => result.ok),
    results,
    userAgent
  }

  console.log(JSON.stringify(report, null, 2))

  if (!report.ok) process.exitCode = 1
}

main().catch(error => {
  console.error(
    error instanceof Error ? error.stack : String(error)
  )
  process.exitCode = 1
})
