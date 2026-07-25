import {
  expect,
  test,
  type Page,
  type Route
} from 'playwright/test'
import {
  attachAssistantTransportGraph,
  observeAssistantTransportGraph
} from './assistantTransportGraph'

const BASE_URL = 'http://localhost:3217'
const ASSISTANT_BUCKET_STORAGE_KEY = 'utekos_assistant_bucket_v1'
const SAFE_PAGE_PATH = '/frakt-og-retur'

async function isolateBrowserNetwork(page: Page) {
  await page.route('**/*', async (route: Route) => {
    const url = new URL(route.request().url())

    if (
      url.origin !== BASE_URL ||
      url.pathname.startsWith('/__gtg') ||
      url.pathname.startsWith('/__sgtm')
    ) {
      await route.abort('blockedbyclient')
      return
    }

    await route.continue()
  })
}

test.beforeEach(async ({ page }) => {
  await isolateBrowserNetwork(page)
})

test('optimized production does not request the assistant transport graph when rollout is absent', async ({
  page
}, testInfo) => {
  const assistantGraph = observeAssistantTransportGraph(page)

  expect(
    process.env.CUSTOMER_ASSISTANT_ROLLOUT_PERCENT
  ).toBeUndefined()
  expect(process.env.VERCEL_ENV).toBe('production')

  await page.goto(SAFE_PAGE_PATH)
  await expect(
    page.getByRole('button', { name: 'Kjøpshjelp', exact: true })
  ).toHaveCount(0)
  await assistantGraph.settle()

  await attachAssistantTransportGraph(
    testInfo,
    'assistant-graph-production-zero.json',
    assistantGraph.paths
  )

  expect([...assistantGraph.paths]).toEqual([])
  expect(
    await page.evaluate(
      key => localStorage.getItem(key),
      ASSISTANT_BUCKET_STORAGE_KEY
    )
  ).toBeNull()
})
