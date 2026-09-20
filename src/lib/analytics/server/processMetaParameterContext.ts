import {
  ParamBuilder,
  PlainDataObject,
  type CookieSettings,
  type Cookies,
  type QueryParams
} from 'capi-param-builder-nodejs'
import {
  metaParameterContextResponseSchema,
  type MetaParameterContextRequest,
  type MetaParameterContextResponse
} from '../metaParameterContextContract'

const META_COOKIE_DOMAINS = ['utekos.no', 'localhost'] as const

export type ProcessMetaParameterContextInput = {
  clientIpAddress?: string
  cookies: Cookies
  payload: MetaParameterContextRequest
}

export type ProcessedMetaParameterContext = {
  cookiesToSet: CookieSettings[]
  identifiers: MetaParameterContextResponse
}

function mapQueryParameters(
  pageUrl: URL,
  fallbackFbclid: string | undefined
): QueryParams {
  const queryParameters = Object.fromEntries(
    pageUrl.searchParams.entries()
  )
  const fbclid =
    pageUrl.searchParams.get('fbclid') || fallbackFbclid
  if (fbclid) queryParameters.fbclid = fbclid
  else delete queryParameters.fbclid

  return queryParameters
}

export function processMetaParameterContext(
  input: ProcessMetaParameterContextInput
): ProcessedMetaParameterContext {
  const pageUrl = new URL(input.payload.page_url)
  const builder = new ParamBuilder([...META_COOKIE_DOMAINS])
  const context = new PlainDataObject(
    pageUrl.host,
    mapQueryParameters(pageUrl, input.payload.fbclid),
    input.cookies,
    input.payload.referrer_url ?? null,
    null,
    input.clientIpAddress ?? null,
    pageUrl.protocol.slice(0, -1),
    `${pageUrl.pathname}${pageUrl.search}`
  )

  const cookiesToSet = builder.processRequestFromContext(context)
  const identifiers = metaParameterContextResponseSchema.parse({
    ...(builder.getFbc() ? { fbc: builder.getFbc() } : {}),
    fbp: builder.getFbp()
  })

  return { cookiesToSet, identifiers }
}
