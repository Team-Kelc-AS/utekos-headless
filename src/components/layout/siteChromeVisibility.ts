const HEADER_AND_FOOTER_HIDDEN_ROUTE_PREFIXES = [
  '/utvalg/techdown'
] as const

export function shouldHideHeaderAndFooter(
  pathname: string | null
): boolean {
  if (!pathname) {
    return false
  }

  return HEADER_AND_FOOTER_HIDDEN_ROUTE_PREFIXES.some(
    routePrefix =>
      pathname === routePrefix ||
      pathname.startsWith(`${routePrefix}/`)
  )
}
