import assert from 'node:assert/strict'
import test from 'node:test'

import { FacebookAdsApi } from 'facebook-nodejs-business-sdk'

import { buildMetaCatalogAd } from './buildMetaCatalogAd'
import { META_GRAPH_API_VERSION } from './metaCatalogConstants'
import { submitMetaCatalogAd } from './submitMetaCatalogAd'

const request = buildMetaCatalogAd({
  adName: 'UTEKOS | Advantage+ Catalog | v26',
  adSetId: '120247531435510788',
  instagramUserId: '17841409220835205',
  link: 'https://utekos.no/produkter/utekos-techdown',
  message: 'Skreddersy varmen med Utekos TechDown™.',
  pageId: '101843722195040',
  pixelId: '1092362672918571',
  productSetId: '2063661761231205'
})

test('uses the pinned v26 Business SDK', () => {
  assert.equal(FacebookAdsApi.VERSION, META_GRAPH_API_VERSION)
  assert.equal(FacebookAdsApi.SDK_VERSION, '26.0.1')
})

test('validates the complete paused ad without mutating Meta', async () => {
  const observed: {
    method?: string
    params?: Record<string, unknown>
    path?: string[]
  } = {}

  const result = await submitMetaCatalogAd({
    accessToken: 'secret-token',
    adAccountId: '772268237116474',
    mode: 'validate',
    request,
    apiCall: async (method, path, params) => {
      observed.method = method
      observed.path = path
      observed.params = params

      return { success: true }
    }
  })

  assert.deepEqual(result, { success: true })
  assert.equal(observed.method, 'POST')
  assert.deepEqual(observed.path, [
    'act_772268237116474',
    'ads'
  ])
  assert.deepEqual(observed.params?.execution_options, [
    'validate_only',
    'synchronous_ad_review'
  ])
  assert.equal(observed.params?.status, 'PAUSED')
  assert.equal(
    (
      observed.params?.creative as {
        object_story_spec: {
          template_data: { preferred_image_tags: string[] }
        }
      }
    ).object_story_spec.template_data.preferred_image_tags.length,
    1
  )
})

test('creates only a paused ad after validation is explicitly bypassed', async () => {
  const observed: { params?: Record<string, unknown> } = {}

  const result = await submitMetaCatalogAd({
    accessToken: 'secret-token',
    adAccountId: '772268237116474',
    mode: 'create',
    request,
    apiCall: async (_method, _path, params) => {
      observed.params = params
      return { id: '120247531999990788' }
    }
  })

  assert.deepEqual(result, { id: '120247531999990788' })
  assert.equal('execution_options' in (observed.params ?? {}), false)
  assert.equal(observed.params?.status, 'PAUSED')
})

test('rejects legacy Collection requests before calling Meta', async () => {
  let apiCalled = false
  const legacyRequest = {
    ...request,
    creative: {
      ...request.creative,
      asset_feed_spec: {
        optimization_type: 'FORMAT_AUTOMATION',
        ad_formats: ['CAROUSEL', 'COLLECTION'],
        descriptions: [{ text: '{{product.description}}' }]
      }
    }
  }

  await assert.rejects(
    submitMetaCatalogAd({
      accessToken: 'secret-token',
      adAccountId: '772268237116474',
      mode: 'create',
      request: legacyRequest,
      apiCall: async () => {
        apiCalled = true
        return { id: '120247531999990788' }
      }
    }),
    /asset_feed_spec/
  )
  assert.equal(apiCalled, false)
})

test('sanitizes SDK failures without exposing token-bearing URLs', async () => {
  await assert.rejects(
    submitMetaCatalogAd({
      accessToken: 'secret-token',
      adAccountId: '772268237116474',
      mode: 'validate',
      request,
      apiCall: async () => {
        throw {
          url: 'https://graph.facebook.com/v26.0/ads?access_token=secret-token',
          data: { access_token: 'secret-token' },
          response: {
            code: 100,
            error_subcode: 1885183,
            error_user_msg:
              'App is in development mode for secret-token',
            message: 'Invalid parameter',
            type: 'OAuthException'
          }
        }
      }
    }),
    error => {
      assert.ok(error instanceof Error)
      assert.match(error.message, /subcode 1885183/)
      assert.match(error.message, /development mode/)
      assert.match(error.message, /\[redacted\]/)
      assert.doesNotMatch(error.message, /secret-token/)
      return true
    }
  )
})
