import { controlInputSchema } from './controlInput'
import { controlResultSchema } from './controlResult'

export async function fetchControlContext(
  input: unknown,
  signal?: AbortSignal
) {
  const args = controlInputSchema.parse(input)
  const params = new URLSearchParams()
  if (args.name) params.set('name', args.name)
  if (args.query) params.set('query', args.query)
  params.set('limit', String(args.limit))
  const response = await fetch(
    `/canonical-control/context?${params}`,
    {
      credentials: 'same-origin',
      cache: 'no-store',
      signal: signal ?? null
    }
  )
  if (response.status === 401) throw new Error('AUTH_REQUIRED')
  if (response.status === 404) throw new Error('EVENT_NOT_FOUND')
  if (!response.ok) throw new Error('CONTEXT_UNAVAILABLE')
  return controlResultSchema.parse(await response.json())
}
