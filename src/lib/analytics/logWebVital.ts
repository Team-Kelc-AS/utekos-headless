const CORE_WEB_VITALS_FOR_POOR_WARN = new Set(['CLS', 'INP', 'LCP'])

export function logWebVital(input: {
  name: string
  pathname: string
  rating?: string
  value: number
}): void {
  const payload = {
    name: input.name,
    pathname: input.pathname,
    rating: input.rating,
    value: input.value
  }

  if (
    input.rating === 'poor' &&
    CORE_WEB_VITALS_FOR_POOR_WARN.has(input.name)
  ) {
    console.warn('[web-vital]', payload)
    return
  }

  console.info('[web-vital]', payload)
}
