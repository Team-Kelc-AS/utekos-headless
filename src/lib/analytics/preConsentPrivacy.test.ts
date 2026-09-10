import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveClickIds } from './clickIdSessionStore'
import { extractClickIds } from './pageViewClientContext'

test('no marketing consent means no URL extraction or storage access', () => {
  let accesses = 0
  const storage = {
    getItem() {
      accesses += 1
      return '{"fbclid":"old-click"}'
    },
    setItem() {
      accesses += 1
    }
  }
  assert.equal(
    resolveClickIds(
      'https://utekos.no/?fbclid=new-click',
      storage,
      storage,
      0,
      {},
      false
    ),
    undefined
  )
  assert.equal(accesses, 0)
  assert.equal(
    extractClickIds(
      'https://utekos.no/?fbclid=new-click',
      '_epik=old-pinterest',
      false
    ),
    undefined
  )
})

test('denied access does not even obtain browser storage handles', () => {
  let accesses = 0
  const previous = Object.getOwnPropertyDescriptor(
    globalThis,
    'window'
  )
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      get sessionStorage() {
        accesses++
        throw new Error('pre-consent sessionStorage access')
      },
      get localStorage() {
        accesses++
        throw new Error('pre-consent localStorage access')
      }
    }
  })
  try {
    assert.equal(
      resolveClickIds(
        'https://utekos.no/?ScCid=snap',
        undefined,
        undefined,
        0,
        {},
        false
      ),
      undefined
    )
    assert.equal(accesses, 0)
  } finally {
    if (previous)
      Object.defineProperty(globalThis, 'window', previous)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})
