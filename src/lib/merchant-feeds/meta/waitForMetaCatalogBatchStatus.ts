import { getMetaCatalogBatchStatus } from './getMetaCatalogBatchStatus'

const SUCCESS_STATUSES = new Set(['complete', 'completed', 'finished'])
const FAILURE_STATUSES = new Set(['error', 'failed'])

export async function waitForMetaCatalogBatchStatus(input: {
  accessToken: string
  handle: string
  fetchImpl?: typeof fetch
  maxAttempts?: number
  delay?: (milliseconds: number) => Promise<void>
}) {
  const maxAttempts = input.maxAttempts ?? 20
  const delay =
    input.delay ??
    (milliseconds =>
      new Promise(resolve => setTimeout(resolve, milliseconds)))

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const status = await getMetaCatalogBatchStatus({
      accessToken: input.accessToken,
      handle: input.handle,
      ...(input.fetchImpl ? { fetchImpl: input.fetchImpl } : {})
    })
    const normalizedStatus = status.status.toLowerCase()

    if (
      status.errors_total_count > 0 ||
      status.ids_of_invalid_requests.length > 0 ||
      FAILURE_STATUSES.has(normalizedStatus)
    ) {
      throw new Error(
        `Meta Catalog API batch ${input.handle} failed: ${JSON.stringify({
          status: status.status,
          errorsTotalCount: status.errors_total_count,
          invalidIds: status.ids_of_invalid_requests,
          errors: status.errors.map(error => error.message)
        })}`
      )
    }

    if (SUCCESS_STATUSES.has(normalizedStatus)) return status

    if (attempt < maxAttempts) await delay(2000)
  }

  throw new Error(
    `Meta Catalog API batch ${input.handle} did not finish after ${maxAttempts} checks`
  )
}
