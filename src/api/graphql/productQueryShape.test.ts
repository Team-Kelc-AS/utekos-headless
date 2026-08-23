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
  getProductQuery
} from './queries/products'

type QueryShape = {
  bytes: number
  expandedFields: number
  maxDepth: number
}

test('PDP product concerns are combined in one GraphQL operation', () => {
  const shellFields = rootFragmentFields(
    getProductQuery,
    'productShell'
  )
  const presentationFields = rootFragmentFields(
    getProductQuery,
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

  assert.match(getProductQuery, /query getProduct\(/)
  assert.match(getProductQuery, /\.\.\.product\b/)
  assert.equal(
    (getProductQuery.match(/product\(handle:/g) ?? []).length,
    1
  )
  assert.doesNotMatch(
    getProductQuery,
    /encodedVariant|adjacentVariants|\bweight(?:Unit)?\b/
  )
  assert.match(getProductOptionsQuery, /encodedVariantExistence/)
  assert.match(getProductOptionsQuery, /encodedVariantAvailability/)
  assert.match(getProductOptionsQuery, /selectedOrFirstAvailableVariant/)
  assert.match(getProductOptionsQuery, /adjacentVariants/)
})

test('PDP product operations stay within their static shape budgets', () => {
  assert.deepEqual(measureQueryShape(getProductQuery), {
    bytes: 3652,
    expandedFields: 114,
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
