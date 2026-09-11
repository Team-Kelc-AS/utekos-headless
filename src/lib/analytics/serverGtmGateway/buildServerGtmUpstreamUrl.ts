import { z } from 'zod'

const serverGtmPathSchema = z
  .array(
    z
      .string()
      .min(1)
      .max(256)
      .refine(
        segment =>
          segment !== '.' &&
          segment !== '..' &&
          !segment.includes('/') &&
          !segment.includes('\\')
      )
  )
  .max(32)
  .refine(segments => segments.join('/').length <= 2048)

const SERVER_GTM_ORIGIN = 'https://cloud.server.utekos.no'

export function buildServerGtmUpstreamUrl(
  path: unknown,
  search: string
) {
  const parsedPath = serverGtmPathSchema.safeParse(path ?? [])
  if (!parsedPath.success) return null

  const encodedPath = parsedPath.data
    .map(segment => encodeURIComponent(segment))
    .join('/')
  const url = new URL(
    encodedPath ? `/${encodedPath}` : '/',
    SERVER_GTM_ORIGIN
  )
  url.search = search

  return url
}
