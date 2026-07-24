import {
  expect,
  test,
  type Page,
  type Route
} from 'playwright/test'
import { observeAssistantTransportGraph } from './assistantTransportGraph'

const BASE_URL = 'http://localhost:3217'
const ASSISTANT_API_PATH = '/api/customer-assistant/chat'
const ASSISTANT_BUCKET_STORAGE_KEY = 'utekos_assistant_bucket_v1'
const SAFE_PAGE_PATH = '/frakt-og-retur'
const PRODUCT_ANSWER =
  'Utekos TechDown er tilgjengelig i størrelsen Medium.'

const runtimeErrors = new WeakMap<Page, string[]>()
const expectedHttpConsoleStatuses = new WeakMap<
  Page,
  Set<number>
>()

function createAssistantStream(
  parts: Array<Record<string, unknown>>
) {
  return `${parts
    .map(part => `data: ${JSON.stringify(part)}\n\n`)
    .join('')}data: [DONE]\n\n`
}

function createProductStream() {
  return createAssistantStream([
    { type: 'text-start', id: 'answer' },
    { type: 'text-delta', id: 'answer', delta: PRODUCT_ANSWER },
    { type: 'text-end', id: 'answer' },
    {
      type: 'data-recommendation',
      data: {
        rank: 1,
        reason: 'Passer for skiftende vær og aktivitet.',
        isPrimary: true,
        product: {
          id: 'gid://shopify/Product/assistant-preview',
          handle: 'utekos-techdown',
          title: 'Utekos TechDown',
          href: '/produkter/utekos-techdown',
          image: null,
          price: { amount: '2499.00', currencyCode: 'NOK' },
          variants: [
            {
              id: 'gid://shopify/ProductVariant/available',
              title: 'Medium',
              availableForSale: true,
              selectedOptions: [
                { name: 'Størrelse', value: 'Medium' }
              ]
            },
            {
              id: 'gid://shopify/ProductVariant/unavailable',
              title: 'Large',
              availableForSale: false,
              selectedOptions: [
                { name: 'Størrelse', value: 'Large' }
              ]
            }
          ]
        }
      }
    },
    {
      type: 'data-status',
      data: { confidence: 'high', failureCode: 'none' }
    }
  ])
}

async function fulfillAssistantStream(
  route: Route,
  body: string
) {
  await route.fulfill({
    status: 200,
    headers: {
      'cache-control': 'no-store, max-age=0',
      'content-type': 'text/event-stream',
      'x-vercel-ai-ui-message-stream': 'v1'
    },
    body
  })
}

async function isolateBrowserNetwork(page: Page) {
  await page.route('**/*', async route => {
    const request = route.request()
    const url = new URL(request.url())

    if (url.origin !== BASE_URL) {
      await route.abort('blockedbyclient')
      return
    }

    if (
      url.pathname.startsWith('/__gtg') ||
      url.pathname.startsWith('/__sgtm')
    ) {
      await route.abort('blockedbyclient')
      return
    }

    if (
      request.method() !== 'GET' &&
      url.pathname.startsWith('/api/') &&
      url.pathname !== ASSISTANT_API_PATH
    ) {
      await route.fulfill({ status: 204, body: '' })
      return
    }

    await route.continue()
  })
}

async function openAssistant(page: Page) {
  const launcher = page.getByRole('button', {
    name: 'Kjøpshjelp',
    exact: true
  })
  await expect(launcher).toBeVisible()
  await launcher.click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

function boxesOverlap(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number }
) {
  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  )
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  runtimeErrors.set(page, errors)
  page.on('pageerror', error =>
    errors.push(`page: ${error.message}`)
  )
  page.on('console', message => {
    if (message.type() !== 'error') return

    const text = message.text()
    if (text.includes('net::ERR_BLOCKED_BY_CLIENT')) return

    const status = /status of (\d{3})/u.exec(text)?.[1]
    if (
      status &&
      expectedHttpConsoleStatuses.get(page)?.has(Number(status))
    ) {
      return
    }

    errors.push(`console: ${text}`)
  })

  await isolateBrowserNetwork(page)
})

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) ?? []).toEqual([])
})

test('uses the exact local preview environment', () => {
  expect(process.env.CUSTOMER_ASSISTANT_ROLLOUT_PERCENT).toBe(
    '100'
  )
  expect(process.env.VERCEL_ENV).toBe('preview')
})

test('shows the accessible launcher, stable bucket, and quick actions', async ({
  page
}) => {
  const assistantGraph = observeAssistantTransportGraph(page)
  await page.goto(SAFE_PAGE_PATH)

  const launcher = page.getByRole('button', {
    name: 'Kjøpshjelp',
    exact: true
  })
  await expect(launcher).toBeVisible()
  await expect
    .poll(async () => {
      await assistantGraph.settle()
      return assistantGraph.paths.size
    })
    .toBeGreaterThan(0)
  await expect(launcher).toHaveAttribute(
    'aria-expanded',
    'false'
  )

  const firstBucket = await page.evaluate(
    key => localStorage.getItem(key),
    ASSISTANT_BUCKET_STORAGE_KEY
  )
  expect(Number(firstBucket)).toBeGreaterThanOrEqual(0)
  expect(Number(firstBucket)).toBeLessThan(1)

  await launcher.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Kjøpshjelp' })
  await expect(dialog).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Kjøpshjelp' })
  ).toBeFocused()

  for (const label of [
    'Finn riktig produkt',
    'Hjelp med størrelse',
    'Se lagerstatus',
    'Frakt og retur',
    'Noe annet'
  ]) {
    await expect(
      page.getByRole('button', { name: label, exact: true })
    ).toBeVisible()
  }

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(launcher).toBeFocused()

  await page.goto('/vilkar-betingelser')
  expect(
    await page.evaluate(
      key => localStorage.getItem(key),
      ASSISTANT_BUCKET_STORAGE_KEY
    )
  ).toBe(firstBucket)
})

test('renders a deterministic product stream without numeric inventory and preserves feedback', async ({
  page
}) => {
  let markRequestStarted: () => void = () => {}
  let releaseResponse: () => void = () => {}
  const requestStarted = new Promise<void>(resolve => {
    markRequestStarted = resolve
  })
  const responseGate = new Promise<void>(resolve => {
    releaseResponse = resolve
  })

  await page.route(`**${ASSISTANT_API_PATH}`, async route => {
    markRequestStarted()
    await responseGate
    await fulfillAssistantStream(route, createProductStream())
  })
  await page.goto(SAFE_PAGE_PATH)
  await openAssistant(page)

  const announcer = page.locator(
    'p[aria-live="polite"][aria-atomic="true"]'
  )
  await expect(announcer).toBeEmpty()
  await page
    .getByRole('button', { name: 'Finn riktig produkt' })
    .click()
  await requestStarted
  await page
    .getByRole('button', { name: 'Lukk kjøpshjelp' })
    .click()
  await page
    .getByRole('button', { name: 'Kjøpshjelp', exact: true })
    .click()
  await expect(announcer).toBeEmpty()
  releaseResponse()

  const productCard = page
    .getByRole('article')
    .filter({
      has: page.getByRole('heading', { name: 'Utekos TechDown' })
    })
  await expect(productCard).toContainText('Tilgjengelig nå')
  await expect(productCard).toContainText('Medium')
  await expect(productCard).not.toContainText(
    /\b\d+\s*(?:igjen|på lager)\b/iu
  )
  await expect(productCard).not.toContainText('Large')
  await expect(announcer).toHaveText(
    `Kjøpshjelp: ${PRODUCT_ANSWER}`
  )
  await expect(
    page.locator('ol[aria-label="Samtale"]')
  ).not.toHaveAttribute('aria-live', /.+/u)
  const answerBubble = page
    .locator('ol[aria-label="Samtale"] p.whitespace-pre-wrap')
    .filter({ hasText: PRODUCT_ANSWER })
  await expect(answerBubble).toHaveCount(1)
  await expect(answerBubble).not.toHaveAttribute(
    'aria-live',
    /.+/u
  )

  const helpful = page.getByRole('button', {
    name: 'Nyttig',
    exact: true
  })
  const notHelpful = page.getByRole('button', {
    name: 'Ikke nyttig',
    exact: true
  })
  await helpful.click()
  await expect(helpful).toBeDisabled()
  await expect(helpful).toHaveAttribute('aria-pressed', 'true')
  await expect(notHelpful).toBeDisabled()

  await page
    .getByRole('button', { name: 'Lukk kjøpshjelp' })
    .click()
  await page
    .getByRole('button', { name: 'Kjøpshjelp', exact: true })
    .click()
  await expect(helpful).toBeDisabled()
  await expect(helpful).toHaveAttribute('aria-pressed', 'true')
  await expect(notHelpful).toBeDisabled()
  await expect(announcer).toBeEmpty()
})

test('routes an order question through the safe local restricted handoff', async ({
  page
}) => {
  await page.goto(SAFE_PAGE_PATH)
  await openAssistant(page)

  const responsePromise = page.waitForResponse(
    response =>
      new URL(response.url()).pathname === ASSISTANT_API_PATH
  )
  await page
    .getByRole('textbox', { name: 'Skriv spørsmålet ditt' })
    .fill('Hvor er ordren min 12345?')
  await page
    .getByRole('button', { name: 'Send spørsmål' })
    .click()

  const response = await responsePromise
  expect(response.status()).toBe(200)
  expect(
    response.headers()['x-vercel-ai-ui-message-stream']
  ).toBe('v1')

  await expect(
    page.getByRole('heading', { name: 'Snakk med kundeservice' })
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Åpne kontaktskjema' })
  ).toHaveAttribute('href', '/kontaktskjema')
  await expect(
    page
      .getByRole('dialog')
      .getByRole('link', {
        name: 'kundeservice@utekos.no',
        exact: true
      })
  ).toHaveAttribute('href', 'mailto:kundeservice@utekos.no')
  await expect(
    page
      .getByRole('dialog')
      .getByRole('link', {
        name: '+47 40 21 63 43',
        exact: true
      })
  ).toHaveAttribute('href', 'tel:+4740216343')
})

test('keeps the mobile header and cart action unobscured', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(SAFE_PAGE_PATH)

  const cart = page.getByRole('button', {
    name: /Åpne handlekurven/iu
  })
  const launcher = page.getByRole('button', {
    name: 'Kjøpshjelp',
    exact: true
  })
  await expect(cart).toBeVisible()
  await expect(launcher).toBeVisible()

  const cartBox = await cart.boundingBox()
  const launcherBox = await launcher.boundingBox()
  expect(cartBox).not.toBeNull()
  expect(launcherBox).not.toBeNull()
  expect(boxesOverlap(cartBox!, launcherBox!)).toBe(false)

  await launcher.click()
  const panel = page.getByRole('dialog', { name: 'Kjøpshjelp' })
  const panelBox = await panel.boundingBox()
  expect(panelBox).not.toBeNull()
  expect(boxesOverlap(cartBox!, panelBox!)).toBe(false)
  await expect(cart).toBeVisible()
})

test('shows a safe contact fallback when the assistant API fails', async ({
  page
}) => {
  expectedHttpConsoleStatuses.set(page, new Set([503]))
  await page.route(`**${ASSISTANT_API_PATH}`, async route => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'preview_failure' })
    })
  })
  await page.goto(SAFE_PAGE_PATH)
  await openAssistant(page)

  await page
    .getByRole('textbox', { name: 'Skriv spørsmålet ditt' })
    .fill('Kan dere hjelpe meg?')
  await page
    .getByRole('button', { name: 'Send spørsmål' })
    .click()

  await expect(
    page.getByRole('dialog').getByRole('alert')
  ).toHaveText(
    'Jeg fikk ikke hentet et sikkert svar. Du kan kontakte kundeservice.'
  )
  await expect(
    page.getByRole('heading', { name: 'Snakk med kundeservice' })
  ).toBeVisible()
})

test('does not mount on design or checkout-like routes', async ({
  page
}) => {
  const assistantGraph = observeAssistantTransportGraph(page)
  const launcher = page.getByRole('button', {
    name: 'Kjøpshjelp',
    exact: true
  })

  await page.goto('/design')
  await expect(launcher).toHaveCount(0)
  await assistantGraph.settle()
  expect([...assistantGraph.paths]).toEqual([])
  expect(
    await page.evaluate(
      key => localStorage.getItem(key),
      ASSISTANT_BUCKET_STORAGE_KEY
    )
  ).toBeNull()

  await page.goto('/kjop/fullfort')
  await expect(launcher).toHaveCount(0)
  await assistantGraph.settle()
  expect([...assistantGraph.paths]).toEqual([])
  expect(
    await page.evaluate(
      key => localStorage.getItem(key),
      ASSISTANT_BUCKET_STORAGE_KEY
    )
  ).toBeNull()
})
