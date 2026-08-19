import assert from 'node:assert/strict'
import test from 'node:test'
import { parseClientLogRequestBody } from './parseClientLogRequestBody'

const validClientError = JSON.stringify({
  context: { pathname: '/skreddersy-varmen' },
  data: {
    message: 'Script error.',
    source: 'window_error'
  },
  event: 'client_error',
  level: 'error'
})

test('treats empty and non-JSON bodies as unreadable', () => {
  assert.equal(parseClientLogRequestBody('').status, 'unreadable')
  assert.equal(parseClientLogRequestBody('   ').status, 'unreadable')
  assert.equal(parseClientLogRequestBody('{').status, 'unreadable')
  assert.equal(parseClientLogRequestBody('not-json').status, 'unreadable')
})

test('accepts a contract-valid client error payload', () => {
  const parsed = parseClientLogRequestBody(validClientError)
  assert.equal(parsed.status, 'ok')
  if (parsed.status !== 'ok') return
  assert.equal(parsed.payload.event, 'client_error')
})

test('rejects readable JSON that is outside the client log contract', () => {
  assert.equal(
    parseClientLogRequestBody(JSON.stringify({ event: 'client_error' }))
      .status,
    'invalid'
  )
})
