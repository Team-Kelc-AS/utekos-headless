import assert from 'node:assert/strict'
import test from 'node:test'
import { createAssistantFeedbackStore } from './assistantFeedbackStore'

test('persists only the pseudonymous response fingerprint and bounded rating', async () => {
  const calls: Array<{
    parameters: readonly unknown[]
    query: string
  }> = []
  const store = createAssistantFeedbackStore(
    async (query, parameters) => {
      calls.push({ query, parameters })
      return []
    }
  )

  await store.save({
    rating: 'helpful',
    responseFingerprint: 'a'.repeat(64)
  })

  assert.equal(calls.length, 1)
  assert.match(calls[0]?.query ?? '', /ops\.customer_assistant_feedback/u)
  assert.match(calls[0]?.query ?? '', /on conflict \(response_fingerprint\) do nothing/u)
  assert.deepEqual(calls[0]?.parameters, [
    'a'.repeat(64),
    'helpful'
  ])
})
