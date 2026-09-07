import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import dotenv from 'dotenv'
import { encryptOverrides } from 'flags'
import { chromium } from 'playwright'
import { z } from 'zod'
import { journeyEventSchema } from '../../src/lib/observability/journey/contract'
import type { JourneyEvent } from '../../src/lib/observability/journey/contract'

dotenv.config({ path: '.env.local', quiet: true })
const variant = z
  .enum(['current', 'legacy'])
  .parse(process.argv[2] ?? 'current')
const width = z.coerce
  .number()
  .int()
  .min(320)
  .max(1920)
  .parse(process.argv[3] ?? 1440)
const scenario = z
  .enum(['accepted', 'late-consent', 'blocked-storage'])
  .parse(process.argv[4] ?? 'accepted')
const origin = z
  .url()
  .refine(
    value => new URL(value).hostname === '127.0.0.1',
    'Local test server required'
  )
  .parse(
    process.env.JOURNEY_SMOKE_BASE_URL ?? 'http://127.0.0.1:3274'
  )
const secret = process.env.FLAGS_SECRET
if (!secret)
  throw new Error(
    'FLAGS_SECRET is required for local variant selection'
  )
const overrides = await encryptOverrides(
  { 'skreddersy-varmen-layout-v1': variant },
  secret,
  '1h'
)
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({
    viewport: { width, height: width < 600 ? 844 : 900 }
  })
  await context.addCookies([
    ...(scenario === 'late-consent' ?
      []
    : [
        {
          name: 'CookieConsent',
          value:
            '{statistics:true,marketing:false,preferences:false}',
          url: origin
        },
        { name: '_ga', value: 'GA1.1.1000.2000', url: origin }
      ]),
    {
      name: 'vercel-flag-overrides',
      value: overrides,
      url: origin
    }
  ])
  await context.addInitScript(
    ({ late, blocked }) => {
      Object.defineProperty(window, 'Cookiebot', {
        configurable: true,
        writable: true,
        value:
          late ? undefined : (
            {
              hasResponse: true,
              consent: {
                statistics: true,
                marketing: false,
                preferences: false
              }
            }
          )
      })
      if (blocked)
        Object.defineProperty(window, 'sessionStorage', {
          configurable: true,
          get() {
            throw new DOMException(
              'Test blocked storage',
              'SecurityError'
            )
          }
        })
    },
    {
      late: scenario === 'late-consent',
      blocked: scenario === 'blocked-storage'
    }
  )
  const events: JourneyEvent[] = []
  const canonical: Record<string, unknown>[] = []
  await context.route('**/*', async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (
      url.origin !== origin ||
      url.pathname.startsWith('/__gtg') ||
      url.pathname.startsWith('/__sgtm') ||
      url.pathname.startsWith('/_vercel')
    ) {
      await route.fulfill({ status: 204 })
      return
    }
    if (request.method() === 'POST') {
      if (url.pathname === '/api/observability/journey') {
        const event = journeyEventSchema.parse(
          request.postDataJSON()
        )
        events.push(event)
        await route.fulfill({
          status: 202,
          json: { event_id: event.event_id, status: 'persisted' }
        })
      } else {
        if (url.pathname.startsWith('/api/events/'))
          canonical.push(
            request.postDataJSON() as Record<string, unknown>
          )
        await route.fulfill({ status: 204 })
      }
      return
    }
    await route.continue()
  })
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const firstJourneyRequest = page
    .waitForRequest(
      request =>
        new URL(request.url()).pathname ===
        '/api/observability/journey',
      { timeout: 20000 }
    )
    .then(
      () => true,
      () => false
    )
  await page.goto(
    `${origin}/skreddersy-varmen?utm_source=journey-smoke`,
    { waitUntil: 'domcontentloaded' }
  )
  await page
    .locator(
      scenario === 'late-consent' ?
        '[data-experiment-eligible="false"]'
      : `[data-experiment-variant="${variant}"]`
    )
    .filter({ visible: true })
    .first()
    .waitFor({ timeout: 20000 })
  await page.waitForFunction(
    () =>
      document.querySelectorAll('[data-journey-section]')
        .length >= 9
  )
  if (scenario === 'late-consent') {
    await page.waitForTimeout(1300)
    assert.equal(
      events.length,
      0,
      'no linked observations before a consent decision'
    )
    for (const marketing of [false, true]) {
      await page.evaluate(marketing => {
        Object.assign(window, {
          Cookiebot: {
            hasResponse: true,
            consent: {
              statistics: false,
              marketing,
              preferences: false
            }
          }
        })
        window.dispatchEvent(new Event('CookiebotOnAccept'))
      }, marketing)
      await page.waitForTimeout(200)
      assert.equal(
        events.length,
        0,
        'denied analytics stays unlinked independently of marketing'
      )
    }
    await page
      .locator('[data-journey-section="purchase"]')
      .filter({ visible: true })
      .first()
      .scrollIntoViewIfNeeded()
    await page.evaluate(() => {
      Object.assign(window, {
        Cookiebot: {
          hasResponse: true,
          consent: {
            statistics: true,
            marketing: false,
            preferences: false
          }
        }
      })
      window.dispatchEvent(new Event('CookiebotOnAccept'))
    })
  }
  const receivedJourneyRequest = await firstJourneyRequest
  assert.ok(
    receivedJourneyRequest,
    receivedJourneyRequest ? undefined : (
      JSON.stringify({
        reason: 'no_journey_transport',
        errors,
        canonical_count: canonical.length,
        browser: await page.evaluate(() => ({
          state: document.readyState,
          visibility: document.visibilityState,
          consent: (
            window as Window & {
              Cookiebot?: {
                hasResponse?: boolean
                consent?: { statistics?: boolean }
              }
            }
          ).Cookiebot,
          script_count: document.scripts.length
        }))
      })
    )
  )
  await page.waitForTimeout(1300)
  assert.equal(
    events.filter(
      event => event.event_name === 'utm_landing_page_view'
    ).length,
    1
  )
  if (scenario === 'late-consent')
    assert.equal(
      events.some(
        event =>
          event.event_name === 'section_view' &&
          event.data.section_id === 'hero'
      ),
      false,
      'late consent does not reconstruct past hero exposure'
    )
  const journeyId = events[0]!.journey_id
  const pageView = canonical.find(
    event => event.event_name === 'page_view'
  )
  if (scenario !== 'late-consent') {
    assert.equal(
      pageView?.journey_id,
      journeyId,
      'canonical and journey collector must use the same journey'
    )
    assert.equal(pageView?.page_view_id, events[0]!.page_view_id)
  }
  const sections = await page
    .locator('[data-journey-section]')
    .filter({ visible: true })
    .evaluateAll(nodes => [
      ...new Set(
        nodes.map(node =>
          node.getAttribute('data-journey-section')
        )
      )
    ])
  for (const section of [
    'hero',
    'empathy',
    'purchase',
    'purchase_button',
    'three_in_one',
    'techdown',
    'reviews',
    'faq',
    'bottom_navigation'
  ]) {
    assert.ok(
      sections.includes(section),
      `missing section ${section}`
    )
    const marker = page
      .locator(`[data-journey-section="${section}"]`)
      .filter({ visible: true })
    assert.equal(
      await marker.count(),
      1,
      `duplicate visible section ${section}`
    )
    if (section === 'empathy') {
      const height = await marker.evaluate(
        node => node.getBoundingClientRect().height
      )
      assert.ok(
        height > 100,
        'empathy marker must cover content, not a sentinel'
      )
    }
    await marker.evaluate(node => {
      const rect = node.getBoundingClientRect()
      window.scrollTo({
        top:
          window.scrollY +
          rect.top +
          rect.height / 2 -
          window.innerHeight / 2,
        behavior: 'instant'
      })
    })
    await page.waitForTimeout(1300)
    assert.ok(
      events.some(
        event =>
          event.event_name === 'section_view' &&
          event.data.section_id === section
      ),
      `section dwell missing for ${section}`
    )
  }
  await page
    .locator(
      '[data-journey-section="bottom_navigation"] a[href="/produkter"]'
    )
    .filter({ visible: true })
    .first()
    .click()
  await page.waitForURL(`${origin}/produkter`)
  await page.waitForTimeout(500)
  const arrivals = events.filter(
    event => event.event_name === 'page_arrival'
  )
  assert.equal(arrivals.at(-1)?.page_path, '/produkter')
  assert.equal(arrivals.at(-1)?.journey_id, journeyId)
  assert.ok(
    events.some(
      event =>
        event.event_name === 'internal_link_click' &&
        event.data.target_path === '/produkter'
    )
  )
  await page.goBack()
  await page.waitForTimeout(800)
  const back = events
    .filter(event => event.event_name === 'page_arrival')
    .at(-1)
  assert.equal(back?.page_path, '/skreddersy-varmen')
  assert.equal(back?.journey_id, journeyId)
  assert.equal(back?.data.navigation_type, 'back_forward')
  await page.evaluate(() => {
    Object.assign(window, {
      Cookiebot: {
        hasResponse: true,
        consent: {
          statistics: false,
          marketing: true,
          preferences: false
        }
      }
    })
    window.dispatchEvent(new Event('CookiebotOnDecline'))
  })
  await page.waitForTimeout(200)
  const afterWithdrawal = events.length
  await page
    .locator('[data-journey-section="hero"]')
    .filter({ visible: true })
    .first()
    .scrollIntoViewIfNeeded()
  await page.waitForTimeout(1300)
  assert.equal(
    events.length,
    afterWithdrawal,
    'withdrawal stops linked observations'
  )
  await page.evaluate(() => {
    Object.assign(window, {
      Cookiebot: {
        hasResponse: true,
        consent: {
          statistics: true,
          marketing: false,
          preferences: false
        }
      }
    })
    window.dispatchEvent(new Event('CookiebotOnAccept'))
  })
  await page.waitForTimeout(1300)
  const renewed = events
    .slice(afterWithdrawal)
    .find(event => event.event_name === 'page_arrival')
  assert.ok(renewed, 'renewed consent starts observation')
  assert.notEqual(
    renewed.journey_id,
    journeyId,
    'renewed consent starts a new journey'
  )
  assert.equal(
    renewed.previous_page_view_id,
    undefined,
    'renewed consent does not restore prior linkage'
  )
  await mkdir(
    'work/journey-observability-validation/screenshots',
    { recursive: true }
  )
  await page.screenshot({
    path: `work/journey-observability-validation/screenshots/${variant}-${width}-${scenario}.png`
  })
  assert.deepEqual(errors, [], 'uncaught storefront errors')
  console.log(
    JSON.stringify({
      variant,
      width,
      scenario,
      event_count: events.length,
      canonical_count: canonical.length,
      sections,
      initial_rendered_variant:
        scenario === 'late-consent' ? 'current' : variant,
      transport: 'intercepted_no_production_writes',
      result: 'passed'
    })
  )
} finally {
  await browser.close()
}
