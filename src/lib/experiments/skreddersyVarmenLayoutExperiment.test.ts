import assert from 'node:assert/strict'
import test from 'node:test'
import {
  readSkreddersyVarmenLayoutAssignment,
  SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY
} from './skreddersyVarmenLayoutExperiment'

function experimentRoot(
  key: string | null,
  variant: string | null
) {
  return {
    querySelector: () => ({
      getAttribute(name: string) {
        return name === 'data-experiment-key' ? key : variant
      }
    })
  }
}

test('reads the declared layout assignment from the rendered page', () => {
  assert.deepEqual(
    readSkreddersyVarmenLayoutAssignment(
      experimentRoot(SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY, 'legacy')
    ),
    { key: SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY, variant: 'legacy' }
  )
})

test('rejects unknown keys and variants', () => {
  assert.equal(
    readSkreddersyVarmenLayoutAssignment(
      experimentRoot('other-flag', 'legacy')
    ),
    undefined
  )
  assert.equal(
    readSkreddersyVarmenLayoutAssignment(
      experimentRoot(
        SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY,
        'unknown'
      )
    ),
    undefined
  )
})
