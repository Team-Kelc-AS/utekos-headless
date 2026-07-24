import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ASSISTANT_BUCKET_STORAGE_KEY,
  isAssistantExcludedPathname,
  resolveAssistantClientExposure,
  resolveAssistantExposure,
  resolveAssistantProductHandle,
  resolveAssistantRolloutPercent,
  type AssistantBucketStorage
} from './assistantRollout'

test('defaults to zero exposure', () => {
  assert.equal(resolveAssistantRolloutPercent({}), 0)
})

test('accepts an integer from zero through one hundred', () => {
  assert.equal(
    resolveAssistantRolloutPercent({
      CUSTOMER_ASSISTANT_ROLLOUT_PERCENT: '25'
    }),
    25
  )
  assert.equal(
    resolveAssistantRolloutPercent({
      CUSTOMER_ASSISTANT_ROLLOUT_PERCENT: '0'
    }),
    0
  )
  assert.equal(
    resolveAssistantRolloutPercent({
      CUSTOMER_ASSISTANT_ROLLOUT_PERCENT: '100'
    }),
    100
  )
})

test('fails closed for unsafe values', () => {
  for (const value of [
    '101',
    '-1',
    'ten',
    '',
    '25.5',
    ' 25 ',
    '+25'
  ]) {
    assert.equal(
      resolveAssistantRolloutPercent({
        CUSTOMER_ASSISTANT_ROLLOUT_PERCENT: value
      }),
      0
    )
  }
})

test('uses the same stable bucket boundary for assistant and holdout', () => {
  assert.equal(resolveAssistantExposure(25, 0.2499), 'assistant')
  assert.equal(resolveAssistantExposure(25, 0.25), 'holdout')
})

test('fails closed for invalid percent or bucket inputs', () => {
  assert.equal(resolveAssistantExposure(101, 0), 'holdout')
  assert.equal(resolveAssistantExposure(25.5, 0), 'holdout')
  assert.equal(resolveAssistantExposure(25, -0.1), 'holdout')
  assert.equal(resolveAssistantExposure(25, 1), 'holdout')
  assert.equal(
    resolveAssistantExposure(25, Number.NaN),
    'holdout'
  )
})

test('zero percent never reads or writes browser storage', () => {
  let reads = 0
  let writes = 0
  let randomCalls = 0
  const storage: AssistantBucketStorage = {
    getItem() {
      reads += 1
      return '0.1'
    },
    setItem() {
      writes += 1
    }
  }

  assert.equal(
    resolveAssistantClientExposure(0, storage, () => {
      randomCalls += 1
      return 0.1
    }),
    'holdout'
  )
  assert.deepEqual(
    { reads, writes, randomCalls },
    { reads: 0, writes: 0, randomCalls: 0 }
  )
})

test('reuses a valid stable browser bucket', () => {
  let writes = 0
  const storage: AssistantBucketStorage = {
    getItem(key) {
      assert.equal(key, ASSISTANT_BUCKET_STORAGE_KEY)
      return '0.2499'
    },
    setItem() {
      writes += 1
    }
  }

  assert.equal(
    resolveAssistantClientExposure(25, storage, () => {
      throw new Error('a valid stored bucket must be stable')
    }),
    'assistant'
  )
  assert.equal(writes, 0)
})

test('replaces an invalid stored bucket safely', () => {
  const writes: Array<[string, string]> = []
  const storage: AssistantBucketStorage = {
    getItem() {
      return 'not-a-bucket'
    },
    setItem(key, value) {
      writes.push([key, value])
    }
  }

  assert.equal(
    resolveAssistantClientExposure(25, storage, () => 0.25),
    'holdout'
  )
  assert.deepEqual(writes, [
    [ASSISTANT_BUCKET_STORAGE_KEY, '0.25']
  ])
})

test('uses a memory bucket when browser storage is unavailable', () => {
  const storage: AssistantBucketStorage = {
    getItem() {
      throw new Error('storage disabled')
    },
    setItem() {
      throw new Error('storage disabled')
    }
  }

  assert.equal(
    resolveAssistantClientExposure(50, storage, () => 0.2),
    'assistant'
  )
})

test('fails closed when a replacement bucket is invalid', () => {
  const writes: Array<[string, string]> = []
  const storage: AssistantBucketStorage = {
    getItem() {
      return null
    },
    setItem(key, value) {
      writes.push([key, value])
    }
  }

  assert.equal(
    resolveAssistantClientExposure(100, storage, () => 1),
    'holdout'
  )
  assert.deepEqual(writes, [])
})

test('excludes design and checkout-like paths only at route boundaries', () => {
  for (const pathname of [
    '/design',
    '/design/colors',
    '/kjop/fullfort',
    '/kasse',
    '/checkout/payment',
    '/checkouts/session'
  ]) {
    assert.equal(isAssistantExcludedPathname(pathname), true)
  }

  for (const pathname of [
    '/',
    '/produkter',
    '/produkter/comfyrobe',
    '/designer',
    '/kjoperad'
  ]) {
    assert.equal(isAssistantExcludedPathname(pathname), false)
  }
})

test('derives a product handle only from an exact product detail path', () => {
  assert.equal(
    resolveAssistantProductHandle('/produkter/utekos-techdown'),
    'utekos-techdown'
  )
  assert.equal(
    resolveAssistantProductHandle('/produkter/utekos-techdown/'),
    'utekos-techdown'
  )
  assert.equal(resolveAssistantProductHandle('/produkter'), null)
  assert.equal(
    resolveAssistantProductHandle('/produkter/UPPERCASE'),
    null
  )
  assert.equal(
    resolveAssistantProductHandle(
      '/produkter/comfyrobe/reviews'
    ),
    null
  )
})
