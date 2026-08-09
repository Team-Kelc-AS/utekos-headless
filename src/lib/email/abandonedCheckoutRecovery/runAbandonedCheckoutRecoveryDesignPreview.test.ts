import assert from 'node:assert/strict'
import test from 'node:test'

import { runAbandonedCheckoutRecoveryDesignPreview } from './runAbandonedCheckoutRecoveryDesignPreview'

test('renders all three steps across a 30-second no-send timeline', async () => {
  const waits: number[] = []
  const frames: Array<{ step: number; elapsedMs: number }> = []

  await runAbandonedCheckoutRecoveryDesignPreview({
    wait: async durationMs => {
      waits.push(durationMs)
    },
    renderFrame: async frame => {
      frames.push(frame)
    }
  })

  assert.deepEqual(waits, [15_000, 15_000])
  assert.deepEqual(frames, [
    { step: 1, elapsedMs: 0 },
    { step: 2, elapsedMs: 15_000 },
    { step: 3, elapsedMs: 30_000 }
  ])
})
