import { metaGraphErrorResponseSchema } from './metaCatalogGraphResponseSchema'

export async function parseMetaGraphResponse(
  response: Response,
  operation: string
) {
  const body: unknown = await response.json().catch(() => null)

  if (response.ok) return body

  const parsedError = metaGraphErrorResponseSchema.safeParse(body)
  const graphError = parsedError.success ? parsedError.data.error : null
  const details = [
    graphError?.type,
    graphError?.code ? `code ${graphError.code}` : null,
    graphError?.error_subcode ?
      `subcode ${graphError.error_subcode}`
    : null,
    graphError?.message,
    graphError?.fbtrace_id ?
      `trace ${graphError.fbtrace_id}`
    : null
  ]
    .filter(Boolean)
    .join(', ')

  throw new Error(
    `${operation} failed with HTTP ${response.status}${details ? `: ${details}` : ''}`
  )
}
