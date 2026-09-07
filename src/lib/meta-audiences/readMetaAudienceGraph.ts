import { z } from 'zod'

export async function readMetaAudienceGraph<T>(
  path: string,
  params: Record<string, string>,
  schema: z.ZodType<T>,
  accessToken: string,
  fetcher: typeof fetch = fetch
): Promise<T> {
  if (!/^[a-zA-Z0-9_/-]+$/.test(path) || path.includes('..'))
    throw new Error('Invalid Graph path')
  const url = new URL(`https://graph.facebook.com/v26.0/${path}`)
  for (const [key, value] of Object.entries(params)) {
    if (/token|secret/i.test(key))
      throw new Error('Credentials must not be URL parameters')
    url.searchParams.set(key, value)
  }
  const response = await fetcher(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(30000)
  })
  const body: unknown = await response.json()
  const error = z
    .object({
      error: z.object({
        code: z.number(),
        error_subcode: z.number().optional()
      })
    })
    .safeParse(body)
  if (!response.ok || error.success)
    throw new Error(
      `Meta read failed: HTTP ${response.status}; code ${error.success ? error.data.error.code : 'unknown'}`
    )
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    throw new Error(
      `Meta response contract failed for ${path}: ${parsed.error.issues.map(x => x.path.join('.')).join(', ')}`
    )
  return parsed.data
}
