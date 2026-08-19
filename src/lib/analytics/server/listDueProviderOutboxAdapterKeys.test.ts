import assert from 'node:assert/strict'
import test from 'node:test'
import { listDueProviderOutboxAdapterKeys } from './listDueProviderOutboxAdapterKeys'

test('returns distinct registered adapter keys from due rows', async () => {
  const keys = await listDueProviderOutboxAdapterKeys(async () => [
    { adapter_key: 'meta:page_view' },
    { adapter_key: 'meta:page_view' },
    { adapter_key: 'google:view_item' },
    { adapter_key: 'unknown:legacy_event' },
    { adapter_key: 42 }
  ])

  assert.deepEqual(keys, ['meta:page_view', 'google:view_item'])
})
