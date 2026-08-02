import assert from 'node:assert/strict'
import test from 'node:test'

import type { ActionState } from '@/lib/actions/subscribeToNewsLetters'

import { createSafeNewsletterAction } from './createSafeNewsletterAction'

const initialState: ActionState = { status: 'idle', message: '' }

test('returns the newsletter action result after adding tracking context', async () => {
  const formData = new FormData()
  const expected: ActionState = {
    status: 'success',
    message: 'Påmeldingen er fullført.'
  }
  let receivedTrackingContext = false

  const submit = createSafeNewsletterAction({
    appendTrackingContext: submittedFormData => {
      submittedFormData.set('leadTrackingContext', '{}')
    },
    subscribe: async (_previousState, submittedFormData) => {
      receivedTrackingContext =
        submittedFormData.get('leadTrackingContext') === '{}'
      return expected
    }
  })

  assert.deepEqual(
    await submit(initialState, formData),
    expected
  )
  assert.equal(receivedTrackingContext, true)
})

test('returns a controlled error when tracking enrichment throws', async () => {
  let subscribeWasCalled = false
  const submit = createSafeNewsletterAction({
    appendTrackingContext: () => {
      throw new Error('tracking unavailable')
    },
    subscribe: async () => {
      subscribeWasCalled = true
      return initialState
    }
  })

  assert.deepEqual(await submit(initialState, new FormData()), {
    status: 'error',
    message: 'Noe gikk galt. Prøv igjen senere.'
  })
  assert.equal(subscribeWasCalled, false)
})

test('returns a controlled error when the server action rejects', async () => {
  const submit = createSafeNewsletterAction({
    appendTrackingContext: () => {},
    subscribe: async () => {
      throw new Error('server action transport failed')
    }
  })

  assert.deepEqual(await submit(initialState, new FormData()), {
    status: 'error',
    message: 'Noe gikk galt. Prøv igjen senere.'
  })
})
