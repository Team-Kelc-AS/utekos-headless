import {
  classifyBrowserEventTraffic,
  type BrowserEventTrafficVerdict
} from './classifyBrowserEventTraffic'

export type BrowserEventRouteHandlerDependencies = {
  classifyTraffic?: (
    request: Request
  ) => Promise<BrowserEventTrafficVerdict>
  collect: (request: Request) => Promise<Response>
}

export function createBrowserEventRouteHandler() {
  return async function handleRoute(
    request: Request,
    dependencies: BrowserEventRouteHandlerDependencies
  ) {
    const verdict = await (
      dependencies.classifyTraffic ??
      classifyBrowserEventTraffic
    )(request)

    if (verdict.excludeFromMarketingDispatch) {
      console.info(
        '[tracking] browser event excluded from marketing dispatch',
        {
          classification: verdict.classification,
          method: request.method,
          path: new URL(request.url).pathname
        }
      )

      return new Response(null, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Utekos-Traffic-Classification':
            verdict.classification
        },
        status: 204
      })
    }

    return dependencies.collect(request)
  }
}
