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
    reasonIsError: true,
    errorName: 'Error'
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

test('reports only allowlisted error names', () => {
  const zodError = new Error('invalid viewport')
  zodError.name = 'ZodError'
  assert.equal(
    describeUnhandledRejection(zodError, undefined).errorName,
    'ZodError'
  )

  const arbitraryError = new Error('contains private details')
  arbitraryError.name = 'Customer customer@example.no'
  assert.equal(
    describeUnhandledRejection(arbitraryError, undefined).errorName,
    'OtherError'
  )
})
