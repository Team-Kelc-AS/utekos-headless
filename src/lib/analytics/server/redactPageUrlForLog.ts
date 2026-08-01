export function redactPageUrlForLog(
  pageUrl: string | undefined
): string | undefined {
  if (pageUrl === undefined) return undefined

  try {
    const redactedUrl = new URL(pageUrl)
    redactedUrl.search = ''
    redactedUrl.hash = ''
    return redactedUrl.toString()
  } catch {
    return pageUrl.split(/[?#]/, 1)[0]
  }
}
