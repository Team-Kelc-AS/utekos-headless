import { getControlSession } from '@/lib/canonical-control/getControlSession'
import { controlInputSchema } from '@/lib/canonical-control/controlInput'
import {
  createControlContextResponse,
  controlErrorSchema
} from '@/lib/canonical-control/createControlContextResponse'

export async function GET(request: Request) {
  const headers = {
    'Cache-Control': 'private, no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }
  if (!(await getControlSession()))
    return Response.json(
      controlErrorSchema.parse({ error: 'AUTH_REQUIRED' }),
      { status: 401, headers }
    )
  const url = new URL(request.url)
  const entries = [...url.searchParams.entries()]
  if (
    entries.length > 3 ||
    new Set(entries.map(([key]) => key)).size !== entries.length
  )
    return Response.json(
      controlErrorSchema.parse({ error: 'INVALID_INPUT' }),
      { status: 400, headers }
    )
  const input = Object.fromEntries(entries) as Record<
    string,
    unknown
  >
  if (typeof input.limit === 'string')
    input.limit = Number(input.limit)
  const parsed = controlInputSchema.safeParse(input)
  if (!parsed.success)
    return Response.json(
      controlErrorSchema.parse({ error: 'INVALID_INPUT' }),
      { status: 400, headers }
    )
  return createControlContextResponse(parsed.data, headers)
}
