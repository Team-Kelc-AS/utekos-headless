import { FacebookAdsApi } from 'facebook-nodejs-business-sdk'

import {
  metaCatalogAdSubmissionInputSchema,
  metaCatalogAdSubmissionResponseSchema,
  type MetaCatalogAdRequest
} from './metaCatalogAdSchema'
import { META_GRAPH_API_VERSION } from './metaCatalogConstants'
import { metaGraphErrorResponseSchema } from './metaCatalogGraphResponseSchema'

type MetaApiCall = (
  method: string,
  path: string[],
  params: Record<string, unknown>
) => Promise<unknown>

export async function submitMetaCatalogAd(input: {
  accessToken: string
  adAccountId: string
  apiCall?: MetaApiCall
  mode: 'validate' | 'create'
  request: MetaCatalogAdRequest
}) {
  const parsed = metaCatalogAdSubmissionInputSchema.parse({
    accessToken: input.accessToken,
    adAccountId: input.adAccountId,
    mode: input.mode,
    request: input.request
  })

  if (FacebookAdsApi.VERSION !== META_GRAPH_API_VERSION) {
    throw new Error(
      `Meta Business SDK must use ${META_GRAPH_API_VERSION}, received ${FacebookAdsApi.VERSION}`
    )
  }

  const apiCall =
    input.apiCall ??
    ((method, path, params) => {
      const api = new FacebookAdsApi(
        parsed.accessToken,
        'en_US',
        false
      )

      return api.call(method, path, params)
    })
  const params: Record<string, unknown> = {
    ...parsed.request,
    ...(parsed.mode === 'validate' ?
      {
        execution_options: [
          'validate_only',
          'synchronous_ad_review'
        ]
      }
    : {})
  }

  let response: unknown

  try {
    response = await apiCall(
      'POST',
      [`act_${parsed.adAccountId}`, 'ads'],
      params
    )
  } catch (error) {
    const candidate = error as { response?: unknown }
    const parsedError = metaGraphErrorResponseSchema.safeParse({
      error: candidate.response
    })
    const graphError =
      parsedError.success ? parsedError.data.error : null
    const details = [
      graphError?.type,
      graphError?.code ? `code ${graphError.code}` : null,
      graphError?.error_subcode ?
        `subcode ${graphError.error_subcode}`
      : null,
      graphError?.error_user_title,
      graphError?.error_user_msg ?? graphError?.message
    ]
      .filter(Boolean)
      .join(', ')
      .replaceAll(parsed.accessToken, '[redacted]')

    throw new Error(
      `Meta catalog ad ${parsed.mode} failed${details ? `: ${details}` : ''}`
    )
  }

  const result = metaCatalogAdSubmissionResponseSchema.parse(response)

  if (parsed.mode === 'validate' && !('success' in result)) {
    throw new Error(
      'Meta created an ad during validate-only execution'
    )
  }

  if (parsed.mode === 'create' && !('id' in result)) {
    throw new Error('Meta did not return an ad ID during creation')
  }

  return result
}
