import assert from 'node:assert/strict'
import test from 'node:test'
import { findMatchingVariant } from './findMatchingVariant'
import type { ProductCardProps } from '@types'

test('findMatchingVariant finds the correct variant when selectedOptions match', () => {
  const mockProduct = {
    variants: {
      edges: [
        {
          node: {
            id: 'variant-1',
            title: 'S / Blue',
            availableForSale: true,
            selectedOptions: [
              { name: 'Størrelse', value: 'S' },
              { name: 'Farge', value: 'Blue' }
            ]
          }
        },
        {
          node: {
            id: 'variant-2',
            title: 'M / Blue',
            availableForSale: true,
            selectedOptions: [
              { name: 'Størrelse', value: 'M' },
              { name: 'Farge', value: 'Blue' }
            ]
          }
        }
      ]
    }
  } as unknown as ProductCardProps['product']

  const result = findMatchingVariant(mockProduct, {
    Størrelse: 'M',
    Farge: 'Blue'
  })

  assert.ok(result)
  assert.equal(result.id, 'variant-2')
})

test('findMatchingVariant returns undefined when no variant matches', () => {
  const mockProduct = {
    variants: {
      edges: [
        {
          node: {
            id: 'variant-1',
            title: 'S / Blue',
            availableForSale: true,
            selectedOptions: [
              { name: 'Størrelse', value: 'S' },
              { name: 'Farge', value: 'Blue' }
            ]
          }
        }
      ]
    }
  } as unknown as ProductCardProps['product']

  const result = findMatchingVariant(mockProduct, {
    Størrelse: 'L',
    Farge: 'Blue'
  })

  assert.equal(result, undefined)
})

test('findMatchingVariant returns undefined when product has no variants', () => {
  const mockProduct = {
    variants: {
      edges: []
    }
  } as unknown as ProductCardProps['product']

  const result = findMatchingVariant(mockProduct, {
    Størrelse: 'S'
  })

  assert.equal(result, undefined)
})
