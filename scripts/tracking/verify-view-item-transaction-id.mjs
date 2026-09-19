import { chromium } from 'playwright'

const PRODUCT_URL =
  process.env.VERIFY_PRODUCT_URL ??
  'https://utekos.no/produkter/utekos-dun'
const TIMEOUT_MS = 45_000

function decodeRequestBody(body) {
  if (!body) return null
  const text = body.toString('utf8')
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function findTransactionId(value) {
  if (!value || typeof value !== 'object') return null
  if (typeof value.transaction_id === 'string') return value.transaction_id
  if (typeof value.transactionId === 'string') return value.transactionId
  for (const nested of Object.values(value)) {
    const found = findTransactionId(nested)
    if (found) return found
  }
  return null
}

async function acceptConsent(page) {
  const selectors = [
    'button:has-text("Tillat alle")',
    'button:has-text("Godta alle")',
    'button:has-text("Accept all")'
  ]

  for (const selector of selectors) {
    const button = page.locator(selector).first()
    if (await button.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await button.click()
      await page.waitForTimeout(1_000)
      return true
    }
  }

  return true
}

async function waitForGrantedConsent(page) {
  await page.waitForFunction(
    () => typeof globalThis.fbq === 'function',
    undefined,
    { timeout: 10_000 }
  ).catch(() => undefined)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent:
      'Utekos view_item transaction_id verification/1.0'
  })
  const page = await context.newPage()

  const viewItemResponses = []
  const sgtmRequests = []

  page.on('response', async response => {
    const url = response.url()
    if (url.includes('/api/events/view-item')) {
      viewItemResponses.push({
        status: response.status(),
        body: await response.json().catch(() => null)
      })
    }
  })

  page.on('request', request => {
    const url = request.url()
    if (url.includes('/__sgtm/') || url.includes('edge.utekos.no')) {
      sgtmRequests.push({
        url,
        method: request.method(),
        body: decodeRequestBody(request.postDataBuffer())
      })
    }
  })

  await page.goto(PRODUCT_URL, {
    waitUntil: 'domcontentloaded',
    timeout: TIMEOUT_MS
  })
  await acceptConsent(page)
  await waitForGrantedConsent(page)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS })
  await page.waitForTimeout(6_000)

  const dataLayerSnapshot = await page.evaluate(() => {
    const layer = globalThis.dataLayer ?? []
    const viewItems = layer.filter(
      entry =>
        entry &&
        typeof entry === 'object' &&
        entry.event === 'view_item'
    )
    return viewItems.map(entry => ({
      event_id: entry.event_id ?? null,
      transaction_id: entry.transaction_id ?? null,
      consent:
        entry.canonical_event?.consent?.analytics ?? null
    }))
  })

  await page.waitForTimeout(3_000)
  await browser.close()

  const apiEventId =
    viewItemResponses.at(-1)?.body?.event_id ??
    viewItemResponses.at(-1)?.body?.eventId ??
    null
  const dataLayerMatch = dataLayerSnapshot.find(
    entry => entry.transaction_id && entry.event_id
  )
  const sgtmTransactionIds = sgtmRequests
    .map(request => findTransactionId(request.body))
    .filter(Boolean)

  const result = {
    ok: false,
    productUrl: PRODUCT_URL,
    apiEventId,
    dataLayer: dataLayerSnapshot,
    dataLayerTransactionMatchesEventId:
      Boolean(dataLayerMatch) &&
      dataLayerMatch.transaction_id === dataLayerMatch.event_id &&
      (!apiEventId || dataLayerMatch.event_id === apiEventId),
    sgtmRequestCount: sgtmRequests.length,
    sgtmTransactionIds,
    sgtmMatchesApiEventId:
      Boolean(apiEventId) &&
      sgtmTransactionIds.some(id => id === apiEventId),
    viewItemResponseCount: viewItemResponses.length
  }

  result.ok = result.dataLayerTransactionMatchesEventId

  if (apiEventId && sgtmRequestCount > 0) {
    result.ok = result.ok && result.sgtmMatchesApiEventId
  }

  console.log(JSON.stringify(result, null, 2))

  if (!result.dataLayerTransactionMatchesEventId) {
    process.exitCode = 1
    return
  }

  if (apiEventId && sgtmRequestCount > 0 && !result.sgtmMatchesApiEventId) {
    process.exitCode = 1
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
