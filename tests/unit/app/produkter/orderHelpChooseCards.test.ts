import assert from 'node:assert/strict'
import test from 'node:test'
import { orderTechDownHelpChooseCards } from '@/app/produkter/(oversikt)/utils/orderHelpChooseCards'

test('puts sold-out TechDown sizes after available ones and Liten last', () => {
  const ordered = orderTechDownHelpChooseCards([
    { sizeLabel: 'Middels', availableForSale: false },
    { sizeLabel: 'Liten', availableForSale: false },
    { sizeLabel: 'Stor', availableForSale: true },
    { sizeLabel: 'Større', availableForSale: true }
  ])

  assert.deepEqual(
    ordered.map(card => card.sizeLabel),
    ['Stor', 'Større', 'Middels', 'Liten']
  )
})

test('keeps Liten last even when it is available', () => {
  const ordered = orderTechDownHelpChooseCards([
    { sizeLabel: 'Liten', availableForSale: true },
    { sizeLabel: 'Middels', availableForSale: false },
    { sizeLabel: 'Større', availableForSale: true },
    { sizeLabel: 'Stor', availableForSale: false }
  ])

  assert.deepEqual(
    ordered.map(card => card.sizeLabel),
    ['Større', 'Stor', 'Middels', 'Liten']
  )
})
