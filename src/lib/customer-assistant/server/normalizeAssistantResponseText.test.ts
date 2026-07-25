import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeAssistantResponseText } from './normalizeAssistantResponseText'

test('removes markdown emphasis without changing the answer text', () => {
  assert.equal(
    normalizeAssistantResponseText(
      '**Fraktkostnader**\nFri frakt over 999 kr.'
    ),
    'Fraktkostnader\nFri frakt over 999 kr.'
  )
  assert.equal(
    normalizeAssistantResponseText(
      '## Retur\nDette er *veiledende* og __trygt__.'
    ),
    'Retur\nDette er veiledende og trygt.'
  )
})
