import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { chromium } from 'playwright'
import type { JourneyEvent } from './contract'

const requireTsx = createRequire(import.meta.resolve('tsx'))
const { buildSync } = requireTsx('esbuild') as {
  buildSync: (options: object) => {
    outputFiles: { text: string }[]
  }
}
const bundle = buildSync({
  absWorkingDir: fileURLToPath(
    new URL('../../../../', import.meta.url)
  ),
  bundle: true,
  write: false,
  platform: 'browser',
  format: 'iife',
  stdin: {
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
    loader: 'ts',
    contents: `
    import { createJourneySession } from './createJourneySession'
    import { observeJourneyPage } from './observeJourneyPage'
    import { createInternalJourneyContextEnricher } from '../../analytics/internalJourneyContext'
    import { createPageViewSession } from '../../analytics/pageViewSession'
    let allowed = false
    let stop
    let cookie = undefined
    const events = []
    const pageViews = createPageViewSession()
    const session = createJourneySession({
      enrich: createInternalJourneyContextEnricher({createId: () => crypto.randomUUID(), getPreviousPageViewId: () => undefined, getStorage: () => sessionStorage}),
      getStorage: () => sessionStorage
    })
    function start() {
      stop?.('consent')
      stop = undefined
      const page = session.open({cookiebot: cookie, pageView: pageViews.ensure({pageUrl: location.href})})
      if (page) stop = observeJourneyPage({page, environment: 'test', send: event => events.push(event), allowed: () => allowed})
    }
    window.journeyHarness = {
      events,
      consent(statistics, marketing = false) {
        allowed = statistics === true
        cookie = statistics === undefined ? undefined : {hasResponse: true, consent: {statistics, marketing}}
        start()
      },
      navigate(path) {
        stop?.('navigation')
        stop = undefined
        history.pushState({}, '', path)
        start()
      },
      hide() { Object.defineProperty(document, 'visibilityState', {configurable:true, value:'hidden'}); document.dispatchEvent(new Event('visibilitychange')) },
      show() { Object.defineProperty(document, 'visibilityState', {configurable:true, value:'visible'}); document.dispatchEvent(new Event('visibilitychange')) }
    }
  `
  }
}).outputFiles[0]!.text

type Harness = {
  events: JourneyEvent[]
  consent: (
    statistics: boolean | undefined,
    marketing?: boolean
  ) => void
  navigate: (path: string) => void
  hide: () => void
  show: () => void
}
declare global {
  interface Window {
    journeyHarness: Harness
  }
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 }
]) {
  test(
    `real browser observes consent, dwell, clicks, progress and navigation at ${viewport.width}px`,
    { timeout: 30_000 },
    async () => {
      const browser = await chromium.launch({ headless: true })
      try {
        const page = await browser.newPage({ viewport })
        const errors: string[] = []
        page.on('pageerror', error => errors.push(error.message))
        const sections = [
          'hero',
          'empathy',
          'purchase',
          'purchase_button',
          'three_in_one',
          'techdown',
          'reviews',
          'faq',
          'bottom_navigation'
        ]
        await page.route('**/*', route =>
          route.fulfill({
            contentType: 'text/html',
            body: `<style>body{margin:0}section{height:1100px}</style>${sections.map(section => `<section data-journey-section="${section}">${section}<a href="/produkter?secret=private" data-journey-link="${section}-products">Products</a></section>`).join('')}`
          })
        )
        await page.goto(
          'http://localhost/skreddersy-varmen?utm_source=facebook'
        )
        await page.addScriptTag({ content: bundle })
        await page.evaluate(() => {
          window.journeyHarness.consent(undefined)
          window.journeyHarness.consent(false, true)
          window.scrollTo(0, 1100)
        })
        assert.equal(
          await page.evaluate(
            () => window.journeyHarness.events.length
          ),
          0
        )
        await page.evaluate(() =>
          window.journeyHarness.consent(true)
        )
        await page.waitForTimeout(1200)
        const initial = await page.evaluate(
          () => window.journeyHarness.events
        )
        assert.equal(
          initial.filter(
            event => event.event_name === 'utm_landing_page_view'
          ).length,
          1
        )
        assert.equal(
          initial.some(
            event =>
              event.event_name === 'section_view' &&
              event.data.section_id === 'hero'
          ),
          false
        )
        assert.equal(
          initial.some(
            event =>
              event.event_name === 'section_view' &&
              event.data.section_id === 'empathy'
          ),
          true
        )
        const journeyId = initial[0]!.journey_id

        await page.evaluate(() => {
          const link = document.querySelector(
            '[data-journey-link="empathy-products"]'
          )!
          link.addEventListener('click', event =>
            event.preventDefault()
          )
          ;(link as HTMLElement).click()
        })
        const click = await page.evaluate(() =>
          window.journeyHarness.events.find(
            event => event.event_name === 'internal_link_click'
          )
        )
        assert.equal(
          click?.event_name === 'internal_link_click' &&
            click.data.target_path,
          '/produkter'
        )
        assert.equal(
          click?.event_name === 'internal_link_click' &&
            click.data.source_section,
          'empathy'
        )
        assert.equal(
          await page.evaluate(
            () =>
              window.journeyHarness.events.filter(
                event => event.event_name === 'page_arrival'
              ).length
          ),
          1
        )

        await page.evaluate(() => window.scrollTo(0, 2200))
        await page.waitForTimeout(1200)
        await page.evaluate(() => window.journeyHarness.hide())
        const progress = await page.evaluate(() =>
          window.journeyHarness.events.filter(
            event => event.event_name === 'journey_progress'
          )
        )
        assert.equal(progress.length, 1)
        assert.equal(
          progress[0]?.event_name === 'journey_progress' &&
            progress[0].data.max_scroll_y,
          2200
        )
        assert.equal(
          progress[0]?.event_name === 'journey_progress' &&
            progress[0].data.last_visible_section,
          'purchase'
        )
        await page.evaluate(() => {
          window.journeyHarness.show()
          window.journeyHarness.navigate('/produkter')
        })
        const arrivals = await page.evaluate(() =>
          window.journeyHarness.events.filter(
            event => event.event_name === 'page_arrival'
          )
        )
        assert.equal(arrivals.length, 2)
        assert.equal(arrivals[1]!.journey_id, journeyId)
        assert.equal(
          arrivals[1]!.previous_page_view_id,
          arrivals[0]!.page_view_id
        )

        await page.evaluate(() =>
          window.journeyHarness.consent(false)
        )
        const count = await page.evaluate(
          () => window.journeyHarness.events.length
        )
        await page.evaluate(() => window.scrollTo(0, 3300))
        await page.waitForTimeout(1100)
        assert.equal(
          await page.evaluate(
            () => window.journeyHarness.events.length
          ),
          count
        )
        await page.evaluate(() => {
          window.journeyHarness.navigate(
            '/skreddersy-varmen?utm_source=facebook'
          )
          window.journeyHarness.consent(true)
        })
        const finalLanding = await page.evaluate(() =>
          window.journeyHarness.events
            .filter(
              event =>
                event.event_name === 'utm_landing_page_view'
            )
            .at(-1)
        )
        assert.notEqual(finalLanding!.journey_id, journeyId)
        assert.deepEqual(errors, [])
      } finally {
        await browser.close()
      }
    }
  )
}
