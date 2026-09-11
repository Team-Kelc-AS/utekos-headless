import { z } from 'zod'
import { metaInsightsApiVersion } from './metaInsightsApiVersion'
import type { MetaInsightsBatchOperation } from './buildMetaInsightsBatchOperations'
import { chunkMetaInsightsBatchOperations } from './chunkMetaInsightsBatchOperations'

const META_INSIGHTS_BATCH_TIMEOUT_MS = 60_000

export type MetaInsightsGraphFetch = (
  input: string,
  init: RequestInit
) => Promise<Pick<Response, 'json' | 'ok' | 'status' | 'headers'>>

const batchItemSchema = z.object({
  code: z.number(),
  body: z.string().optional()
})

const graphErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.number()
  })
})

export type MetaInsightsBatchItem = {
  name: string
  code: number
  body: unknown
}

export async function fetchMetaInsightsGraphBatch(
  accessToken: string,
  operations: readonly MetaInsightsBatchOperation[],
  fetchImplementation: MetaInsightsGraphFetch = fetch
) {
  if (
    operations.some(operation =>
      /access_token|token=/i.test(operation.relative_url)
    )
  ) {
    throw new Error('Meta access tokens must not appear in batch URLs')
  }

  const items: MetaInsightsBatchItem[] = []
  let throttle: string | null = null

  for (const chunk of chunkMetaInsightsBatchOperations(operations)) {
    const body = new URLSearchParams()
    body.set('batch', JSON.stringify(chunk))
    body.set('include_headers', 'false')

    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      META_INSIGHTS_BATCH_TIMEOUT_MS
    )

    try {
      const response = await fetchImplementation(
        `https://graph.facebook.com/${metaInsightsApiVersion}`,
        {
          method: 'POST',
          cache: 'no-store',
          headers: {
            accept: 'application/json',
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/x-www-form-urlencoded'
          },
          body,
          signal: controller.signal
        }
      )
      throttle =
        response.headers.get('x-fb-ads-insights-throttle') ?? throttle
      const payload: unknown = await response.json()
      const graphError = graphErrorSchema.safeParse(payload)
      if (!response.ok || graphError.success) {
        const code = graphError.success
          ? graphError.data.error.code
          : 'unknown'
        throw new Error(
          `Meta Insights batch failed with HTTP ${response.status}; code ${code}`
        )
      }

      const parsed = z.array(batchItemSchema).parse(payload)
      parsed.forEach((item, index) => {
        const operation = chunk[index]
        if (!operation) {
          throw new Error('Meta Insights batch returned extra items')
        }
        items.push({
          name: operation.name,
          code: item.code,
          body: item.body ? JSON.parse(item.body) : null
        })
      })
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error(
          `Meta Insights batch exceeded ${META_INSIGHTS_BATCH_TIMEOUT_MS}ms`
        )
      }
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  return { items, throttle }
}
