import assert from 'node:assert/strict'
import test from 'node:test'
import { selectHelpChooseCards } from '@/app/produkter/(oversikt)/utils/selectHelpChooseCards'
import { createTechDownShopifyProductFixture } from '@/lib/products/testing/createTechDownShopifyProductFixture'
import type { HelpChooseCarouselDefinition } from '@/app/produkter/(oversikt)/utils/helpChooseCarouselConfig'

const definition: HelpChooseCarouselDefinition = {
  id: 'dun',
  handle: 'utekos-dun',
  label: 'Dun',
  itemListId: 'dun',
  itemListName: 'Dun',
  action: 'purchase',
  preferredColor: null,
  includeHiddenSizes: false,
  cards: [
    { size: 'Medium', color: 'Vargnatt', label: 'Vargnatt M' },
    { size: 'Large', color: 'Vargnatt', label: 'Vargnatt L' },
    { size: 'Medium', color: 'Fjellblå', label: 'Fjellblå M' },
    { size: 'Large', color: 'Fjellblå', label: 'Fjellblå L' }
  ]
}

test('keeps exact variant IDs for two colors in the same size, independent of stock and Shopify order', () => {
  const product = createTechDownShopifyProductFixture()
  product.handle = 'utekos-dun'
  const combinations = [
    ['Fjellblå', 'L'],
    ['Vargnatt', 'M'],
    ['Fjellblå', 'M'],
    ['Vargnatt', 'L']
  ]
  product.variants.edges.forEach(({ node }, index) => {
    node.selectedOptions = [
      { name: 'Farge', value: combinations[index]![0]! },
      { name: 'Størrelse', value: combinations[index]![1]! }
    ]
  })
  const cards = selectHelpChooseCards(definition, product)
  assert.deepEqual(
    cards.map(card => card.variant.id),
    [1, 3, 2, 0].map(
      index => product.variants.edges[index]!.node.id
    )
  )
  assert.deepEqual(
    cards.map(card => card.displayTitle),
    definition.cards.map(card => `Utekos Dun™ ${card.label}`)
  )
  assert.strictEqual(
    cards[1]!.variant,
    product.variants.edges[3]!.node
  )
})

test('does not substitute another size or color for a missing variant', () => {
  const product = createTechDownShopifyProductFixture()
  product.handle = 'utekos-dun'
  assert.deepEqual(
    selectHelpChooseCards(definition, product),
    []
  )
})

test('keeps TechDown Middels and Liten last regardless of availability', () => {
  const product = createTechDownShopifyProductFixture()
  const cards = selectHelpChooseCards(
    {
      ...definition,
      id: 'techdown',
      handle: product.handle,
      preferredColor: 'Havdyp',
      includeHiddenSizes: true,
      cards: ['Stor', 'Større', 'Middels', 'Liten'].map(
        size => ({ size })
      )
    },
    product
  )
  assert.deepEqual(
    cards.map(card => card.sizeLabel),
    ['Stor', 'Større', 'Middels', 'Liten']
  )
  assert.deepEqual(
    cards.map(card => card.variant.id),
    [2, 3, 1, 0].map(
      index => product.variants.edges[index]!.node.id
    )
  )
})
