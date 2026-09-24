const MARKDOWN_MEDIA_TYPE = 'text/markdown'
const HTML_MEDIA_TYPE = 'text/html'
const TEXT_RANGE_TYPE = 'text/*'

export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8'

type MediaPreference = {
  type: string
  quality: number
}

function parseAcceptHeader(value: string): MediaPreference[] {
  return value
    .split(',')
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0)
    .map(entry => {
      const [rawType = '', ...rawParams] = entry.split(';')
      let quality = 1
      for (const param of rawParams) {
        const [key, rawValue] = param.split('=').map(part => part.trim())
        if (key === 'q') {
          const parsed = Number(rawValue)
          if (Number.isFinite(parsed)) quality = Math.min(Math.max(parsed, 0), 1)
        }
      }
      return { type: rawType.trim().toLowerCase(), quality }
    })
    .filter(entry => entry.type.length > 0)
}

function qualityFor(
  preferences: MediaPreference[],
  mediaType: string
): number {
  let quality = 0
  for (const preference of preferences) {
    if (preference.type === mediaType) quality = Math.max(quality, preference.quality)
    else if (
      mediaType.startsWith('text/') &&
      preference.type === TEXT_RANGE_TYPE
    )
      quality = Math.max(quality, preference.quality)
  }
  return quality
}

/**
 * True when the client explicitly prefers `text/markdown` over `text/html`.
 * A bare `*\/\*` or `text/*` never opts into Markdown, and ties resolve to
 * HTML so existing browser behavior is preserved.
 */
export function wantsMarkdown(accept: string | null): boolean {
  if (!accept) return false
  const preferences = parseAcceptHeader(accept)
  if (preferences.length === 0) return false
  const markdownQuality = qualityFor(preferences, MARKDOWN_MEDIA_TYPE)
  if (markdownQuality <= 0) return false
  const htmlQuality = qualityFor(preferences, HTML_MEDIA_TYPE)
  return markdownQuality > htmlQuality
}

export function withVaryAccept(headers: Headers): Headers {
  if (!headers.get('Vary')?.split(',').map(v => v.trim().toLowerCase()).includes('accept')) {
    headers.append('Vary', 'Accept')
  }
  return headers
}
