import assert from 'node:assert/strict'
import test from 'node:test'
import { getNewlyOpenedAccordionIds } from './getNewlyOpenedAccordionIds'

test('returns only real closed-to-open accordion transitions', () => {
  assert.deepEqual(getNewlyOpenedAccordionIds([], ['materialer']), [
    'materialer'
  ])
  assert.deepEqual(
    getNewlyOpenedAccordionIds(['materialer'], []),
    []
  )
  assert.deepEqual(
    getNewlyOpenedAccordionIds(['materialer'], ['materialer']),
    []
  )
  assert.deepEqual(getNewlyOpenedAccordionIds([], ['materialer']), [
    'materialer'
  ])
})
