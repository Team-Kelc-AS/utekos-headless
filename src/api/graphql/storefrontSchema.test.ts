import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'
import {
  buildClientSchema,
  parse,
  validate,
  type IntrospectionQuery
} from 'graphql'
import * as cartMutations from './mutations/cart'
import { getCartQuery } from './queries/cart/getCartQuery'
import { getCartLineIdsQuery } from './queries/cart/getCartLineIdsQuery'
import * as productQueries from './queries/products'

const require = createRequire(import.meta.url)
const storefrontSchema = require(
  '@shopify/hydrogen-react/storefront.schema.json'
) as IntrospectionQuery

const documents = {
  ...cartMutations,
  getCartQuery,
  getCartLineIdsQuery,
  ...productQueries
}

test('Storefront operations match the pinned Hydrogen React schema', () => {
  const schema = buildClientSchema(storefrontSchema)

  for (const [name, document] of Object.entries(documents)) {
    const errors = validate(schema, parse(document))

    assert.deepEqual(
      errors.map(error => error.message),
      [],
      `${name} must match the Storefront 2026-04 schema`
    )
  }
})
