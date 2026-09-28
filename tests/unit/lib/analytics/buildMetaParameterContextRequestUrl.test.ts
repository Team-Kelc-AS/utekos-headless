import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMetaParameterContextRequestUrl } from '@/lib/analytics/buildMetaParameterContextRequestUrl'

test('preserves fbclid case and characters in the request query string', () => {
  const fbclid = 'IwAR-AbC_123~mixedCase'
  const requestUrl = new URL(
    buildMetaParameterContextRequestUrl(fbclid),
    'https://utekos.no'
  )

  assert.equal(
    requestUrl.pathname,
    '/api/meta/parameter-context'
  )
  assert.equal(requestUrl.searchParams.get('fbclid'), fbclid)
})

test('omits the query string when no fbclid is available', () => {
  assert.equal(
    buildMetaParameterContextRequestUrl(undefined),
    '/api/meta/parameter-context'
  )
})
