export function withoutTrackingQuery(value: string): string {
  if (!value) return value
  try {
    const url = new URL(value)
    return `${url.origin}${url.pathname}`
  } catch {
    return ''
  }
}
