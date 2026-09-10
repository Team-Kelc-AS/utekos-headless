const routes = new Set([
  '/',
  '/produkter',
  '/skreddersy-varmen',
  '/handlekurv',
  '/checkout',
  '/kontaktskjema',
  '/kundeservice',
  '/personvern',
  '/cookies',
  '/nbcc',
  '/magasinet',
  '/om-oss',
  '/retur',
  '/frakt',
  '/api/log',
  '/api/e/vp',
  '/api/e/wv',
  '/api/events/page-view',
  '/api/events/view-item',
  '/api/events/add-to-cart',
  '/api/events/begin-checkout',
  '/api/events/page-view/capture'
])

export function operationalRoute(pathname: string): string {
  if (routes.has(pathname)) return pathname
  if (pathname.startsWith('/produkter/'))
    return '/produkter/:product'
  if (pathname.startsWith('/magasinet/'))
    return '/magasinet/:article'
  if (pathname.startsWith('/_next/')) return '/_next/:asset'
  if (pathname.startsWith('/api/')) return '/api/:endpoint'
  return '/:other'
}
