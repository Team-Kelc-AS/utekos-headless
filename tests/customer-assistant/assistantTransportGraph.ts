import {
  expect,
  type Page,
  type Response,
  type TestInfo
} from 'playwright/test'
import { writeFile } from 'node:fs/promises'

const BASE_URL = 'http://localhost:3217'
const ASSISTANT_TRANSPORT_GRAPH_MARKERS = [
  '/api/customer-assistant/chat',
  'prepareSendMessagesRequest'
] as const

export async function attachAssistantTransportGraph(
  testInfo: TestInfo,
  name: string,
  paths: Iterable<string>
) {
  const artifactPath = testInfo.outputPath(name)
  await writeFile(
    artifactPath,
    JSON.stringify({ paths: [...paths] }, null, 2)
  )
  await testInfo.attach(name, {
    path: artifactPath,
    contentType: 'application/json'
  })
}

export function observeAssistantTransportGraph(page: Page) {
  const paths = new Set<string>()
  const readErrors: string[] = []
  const pendingReads = new Set<Promise<void>>()

  const inspectResponse = (response: Response) => {
    const url = new URL(response.url())

    if (
      url.origin !== BASE_URL ||
      !url.pathname.startsWith('/_next/static/chunks/') ||
      !url.pathname.endsWith('.js')
    ) {
      return
    }

    const read = response
      .body()
      .then(body => {
        const source = body.toString('utf8')

        if (
          ASSISTANT_TRANSPORT_GRAPH_MARKERS.every(marker =>
            source.includes(marker)
          )
        ) {
          paths.add(url.pathname)
        }
      })
      .catch(error => {
        readErrors.push(`${url.pathname}: ${String(error)}`)
      })

    pendingReads.add(read)
    void read.finally(() => pendingReads.delete(read))
  }

  page.on('response', inspectResponse)

  return {
    paths,
    async settle() {
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(250)

      while (pendingReads.size > 0) {
        await Promise.all([...pendingReads])
      }

      expect(readErrors).toEqual([])
    }
  }
}
