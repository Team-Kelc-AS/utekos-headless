import assert from 'node:assert/strict'
import test from 'node:test'
import {
  dehydrate,
  environmentManager
} from '@tanstack/react-query'
import { getQueryClient } from './getQueryClient'
import { makeQueryClient } from './makeQueryClient'

test('isolates server clients and reuses one browser client', () => {
  const originalIsServer = environmentManager.isServer()

  try {
    environmentManager.setIsServer(() => true)
    assert.notEqual(getQueryClient(), getQueryClient())

    environmentManager.setIsServer(() => false)
    assert.equal(getQueryClient(), getQueryClient())
  } finally {
    environmentManager.setIsServer(() => originalIsServer)
  }
})

test('dehydrates pending queries and delegates error redaction to Next.js', async () => {
  const queryClient = makeQueryClient()
  let resolveQuery: (value: string) => void = () => undefined
  const queryResult = new Promise<string>(resolve => {
    resolveQuery = resolve
  })

  const prefetch = queryClient.prefetchQuery({
    queryKey: ['query-client-contract'],
    queryFn: () => queryResult
  })
  const dehydratedState = dehydrate(queryClient)

  assert.equal(dehydratedState.queries.length, 1)
  assert.equal(
    dehydratedState.queries[0]?.state.status,
    'pending'
  )
  assert.equal(
    queryClient
      .getDefaultOptions()
      .dehydrate?.shouldRedactErrors?.(
        new Error('server-only detail')
      ),
    false
  )

  resolveQuery('ready')
  await prefetch
})
