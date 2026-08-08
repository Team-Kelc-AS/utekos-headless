import assert from 'node:assert/strict'
import test from 'node:test'
import {
  Kind,
  parse,
  type DocumentNode,
  type FragmentDefinitionNode,
  type SelectionSetNode
} from 'graphql'
import {
  getProductOptionsQuery,
  getProductShellQuery,
  getProductVariantPresentationQuery
} from './queries/products'

type QueryShape = {
  bytes: number
  expandedFields: number
  maxDepth: number
}

test('PDP product concerns remain separated by GraphQL operation', () => {
  const shellFields = rootFragmentFields(
    getProductShellQuery,
    'productShell'
  )
  const presentationFields = rootFragmentFields(
    getProductVariantPresentationQuery,
    'productVariantPresentation'
  )

  assert.deepEqual(shellFields, [
    'id',
    'title',
    'tags',
    'handle',
    'updatedAt',
    'productType',
    'vendor',
    'description',
    'collections',
    'compareAtPriceRange',
    'priceRange',
    'featuredImage',
    'images',
    'seo'
  ])
  assert.deepEqual(presentationFields, [
    'id',
    'totalInventory',
    'availableForSale',
    'options',
    'variants'
  ])

  assert.doesNotMatch(
    getProductShellQuery,
    /\bvariants\b|encodedVariant|adjacentVariants|bridgeFor/
  )
  assert.doesNotMatch(
    getProductVariantPresentationQuery,
    /\bdescription\b|\bseo\b|\bcollections\b|\bweight(?:Unit)?\b|encodedVariant|adjacentVariants/
  )
  assert.match(getProductOptionsQuery, /encodedVariantExistence/)
  assert.match(getProductOptionsQuery, /encodedVariantAvailability/)
  assert.match(getProductOptionsQuery, /selectedOrFirstAvailableVariant/)
  assert.match(getProductOptionsQuery, /adjacentVariants/)
})

test('PDP product operations stay within their static shape budgets', () => {
  assert.deepEqual(measureQueryShape(getProductShellQuery), {
    bytes: 997,
    expandedFields: 45,
    maxDepth: 5
  })
  assert.deepEqual(measureQueryShape(getProductVariantPresentationQuery), {
    bytes: 2707,
    expandedFields: 70,
    maxDepth: 11
  })
})

function rootFragmentFields(source: string, name: string): string[] {
  const fragment = parse(source).definitions.find(
    (definition): definition is FragmentDefinitionNode =>
      definition.kind === Kind.FRAGMENT_DEFINITION &&
      definition.name.value === name
  )

  assert.ok(fragment)
  return fragment.selectionSet.selections.map(selection => {
    assert.equal(selection.kind, Kind.FIELD)
    return selection.name.value
  })
}

function measureQueryShape(source: string): QueryShape {
  const document = parse(source)
  const fragments = collectFragments(document)
  let expandedFields = 0
  let maxDepth = 0

  const visit = (
    selectionSet: SelectionSetNode,
    depth: number,
    fragmentStack: string[] = []
  ) => {
    for (const selection of selectionSet.selections) {
      if (selection.kind === Kind.FIELD) {
        expandedFields += 1
        maxDepth = Math.max(maxDepth, depth)

        if (selection.selectionSet) {
          visit(selection.selectionSet, depth + 1, fragmentStack)
        }
        continue
      }

      if (selection.kind === Kind.INLINE_FRAGMENT) {
        visit(selection.selectionSet, depth, fragmentStack)
        continue
      }

      assert.ok(!fragmentStack.includes(selection.name.value))
      const fragment = fragments.get(selection.name.value)
      assert.ok(fragment)
      visit(fragment.selectionSet, depth, [
        ...fragmentStack,
        selection.name.value
      ])
    }
  }

  for (const definition of document.definitions) {
    if (definition.kind === Kind.OPERATION_DEFINITION) {
      visit(definition.selectionSet, 1)
    }
  }

  return {
    bytes: Buffer.byteLength(source),
    expandedFields,
    maxDepth
  }
}

function collectFragments(document: DocumentNode) {
  return new Map(
    document.definitions
      .filter(
        (definition): definition is FragmentDefinitionNode =>
          definition.kind === Kind.FRAGMENT_DEFINITION
      )
      .map(fragment => [fragment.name.value, fragment])
  )
}
