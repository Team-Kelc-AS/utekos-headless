import assert from 'node:assert/strict'
import test from 'node:test'
import { sanitizeServerRequestError } from './sanitizeServerRequestError'

test('server errors retain only bounded operational data, not URLs, headers or free text', () => {
  const error = Object.assign(
    new TypeError('private@example.no fbclid=secret'),
    { digest: '123456789' }
  )
  const value = sanitizeServerRequestError(error, {
    path: '/skreddersy-varmen?fbclid=secret&email=private@example.no',
    method: 'GET',
    headers: {
      'cookie': '_fbc=secret',
      'user-agent': 'private',
      'x-utekos-edge-request-id':
        '11111111-1111-4111-8111-111111111111'
    }
  })
  assert.deepEqual(value, {
    name: 'TypeError',
    path: '/skreddersy-varmen',
    method: 'GET',
    digest: '123456789',
    requestId: '11111111-1111-4111-8111-111111111111'
  })
  assert.doesNotMatch(
    JSON.stringify(value),
    /secret|private|stack|message|fbclid|cookie/
  )
})

test('arbitrary error labels, digests, method and request IDs cannot become log content', () => {
  const value = sanitizeServerRequestError(
    { digest: 'private@example.no' },
    {
      path: '/account/private@example.no',
      method: 'private@example.no',
      headers: {
        'x-utekos-edge-request-id': 'private@example.no'
      }
    }
  )
  assert.equal(value.name, 'ServerError')
  assert.equal(value.method, 'OTHER')
  assert.doesNotMatch(
    JSON.stringify(value),
    /private|digest|requestId/
  )
})
