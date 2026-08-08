import assert from 'node:assert/strict'
import test from 'node:test'
import {
  Kind,
  parse,
  type DocumentNode,
  type FragmentDefinitionNode,
  type SelectionSetNode
} from 'graphql'
import * as cartMutations from './mutations/cart'
import { getCartQuery } from './queries/cart/getCartQuery'

type QueryShape = {
  bytes: number
  expandedFields: number
  maxDepth: number
}

const documents = {
  getCartQuery,
  ...cartMutations
}

test('cart product fragment stays limited to cart consumer fields', () => {
  const document = parse(getCartQuery)
  const fragment = document.definitions.find(
    (definition): definition is FragmentDefinitionNode =>
      definition.kind === Kind.FRAGMENT_DEFINITION &&
      definition.name.value === 'cartProduct'
  )

  assert.ok(fragment)
  assert.deepEqual(
    fragment.selectionSet.selections.map(selection => {
      assert.equal(selection.kind, Kind.FIELD)
      return selection.name.value
    }),
    ['id', 'handle', 'title', 'vendor', 'productType']
  )
})

test('cart queries and mutations stay within the minimal shape budget', () => {
  for (const [name, source] of Object.entries(documents)) {
    const shape = measureQueryShape(source)

    if (name === 'getCartQuery') {
      assert.deepEqual(shape, {
        bytes: 1283,
        expandedFields: 45,
        maxDepth: 7
      })
      continue
    }

    assert.equal(shape.expandedFields, 54, name)
    assert.equal(shape.maxDepth, 8, name)
    assert.ok(shape.bytes <= 1800, name)
  }
})

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
