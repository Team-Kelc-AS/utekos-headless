const IGNORED_ERROR_PATTERNS = [
  'window.webkit.messageHandlers',
  'sendDataToNative',
  'webkit.messageHandlers',
  'Unsupported Summarizer API',
  'The requested language options are not supported',
  'Blocked aria-hidden on an element because its descendant retained focus',
  'CybotCookiebotDialog'
]

/** BotID / Kasada first-party proxy path: /{uuid}/{uuid}/… */
export const BOTID_KASADA_PATH_PATTERN =
  /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(?:(?:a-\d+-a\/)?c\.js|p\.js|mfc|tl|fp)/i

export const BOTID_KASADA_URL_PATTERN = /x-kpsdk/i

export const COOKIEBOT_URL_PATTERN =
  /(?:consent\.cookiebot\.(?:com|eu)|consentcdn\.cookiebot\.(?:com|eu)|cookiebot\.eu|CybotCookiebot)/i

export const CHROME_EXTENSION_URL_PATTERN =
  /^chrome-extension:\/\//i

export type ClientErrorDetails = {
  message: string
  source?: string | undefined
  stack?: string | undefined
}

function haystackIncludes(
  haystack: string | undefined,
  pattern: RegExp
): boolean {
  return typeof haystack === 'string' && pattern.test(haystack)
}

function isBotIdKasadaSource(
  source?: string,
  stack?: string
): boolean {
  return (
    haystackIncludes(source, BOTID_KASADA_PATH_PATTERN) ||
    haystackIncludes(source, BOTID_KASADA_URL_PATTERN) ||
    haystackIncludes(stack, BOTID_KASADA_PATH_PATTERN) ||
    haystackIncludes(stack, BOTID_KASADA_URL_PATTERN)
  )
}

function isCookiebotSource(
  source?: string,
  stack?: string
): boolean {
  return (
    haystackIncludes(source, COOKIEBOT_URL_PATTERN) ||
    haystackIncludes(stack, COOKIEBOT_URL_PATTERN)
  )
}

export function isIgnorableClientError({
  message,
  source,
  stack
}: ClientErrorDetails): boolean {
  if (source && CHROME_EXTENSION_URL_PATTERN.test(source)) {
    return true
  }

  if (isBotIdKasadaSource(source, stack)) {
    return true
  }

  if (isCookiebotSource(source, stack)) {
    return true
  }

  return IGNORED_ERROR_PATTERNS.some(
    pattern =>
      message.includes(pattern) || stack?.includes(pattern)
  )
}
