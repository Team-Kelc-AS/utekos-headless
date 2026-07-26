import assert from 'node:assert/strict'
import test from 'node:test'
import { describeUnhandledRejection } from './describeUnhandledRejection'

test('classifies Error diagnostics without exposing arbitrary values', () => {
  const reason = Object.assign(new Error('observer failed'), {
    code: 'VIEWPORT_ERROR'
  })
  const result = describeUnhandledRejection(
    reason,
    Promise.resolve()
  )

  assert.deepEqual(result, {
    reasonType: 'object',
    reasonIsError: true
  })
  assert.equal(
    JSON.stringify(result).includes('observer failed'),
    false
  )
})

test('classifies primitive rejection reasons', () => {
  const result = describeUnhandledRejection(
    'ReferenceError: Can’t find variable: observer',
    undefined
  )

  assert.deepEqual(result, {
    reasonType: 'string',
    reasonIsError: false
  })
})

test('fails closed when rejection metadata uses throwing traps', () => {
  const reason = new Proxy(
    {},
    {
      getOwnPropertyDescriptor() {
        throw new Error('blocked')
      },
      ownKeys() {
        throw new Error('blocked')
      },
      get() {
        throw new Error('blocked')
      }
    }
  )
  const result = describeUnhandledRejection(reason, undefined)

  assert.deepEqual(result, {
    reasonType: 'object',
    reasonIsError: false
  })
})
