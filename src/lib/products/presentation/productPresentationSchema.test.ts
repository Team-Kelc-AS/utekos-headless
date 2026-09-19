import assert from 'node:assert/strict'
import test from 'node:test'
import { productPresentationDefinitions } from './productPresentationDefinitions'
import { productPresentationDefinitionSchema } from './productPresentationSchema'
import { publicVariantOptionsSchema } from '../publicVariantOptionsSchema'

test('Mini presentation preserves default values, optional fields and strict objects', () => {
  const fixture = productPresentationDefinitions[0]!
  const { hiddenOptionValues: _hidden, ...withoutHidden } =
    fixture
  const parsed =
    productPresentationDefinitionSchema.parse(withoutHidden)
  assert.deepEqual(parsed.hiddenOptionValues, {})
  assert.equal(
    productPresentationDefinitionSchema.safeParse({
      ...fixture,
      hiddenOptionValues: null
    }).success,
    false
  )
  assert.equal(
    productPresentationDefinitionSchema.safeParse({
      ...fixture,
      unexpected: true
    }).success,
    false
  )
  assert.equal(
    productPresentationDefinitionSchema.safeParse({
      ...fixture,
      description: 'Too short'
    }).success,
    false
  )
  assert.deepEqual(publicVariantOptionsSchema.parse({}), {})
  assert.deepEqual(
    publicVariantOptionsSchema.parse({ size: 'Større' }),
    { size: 'Større' }
  )
  assert.equal(
    publicVariantOptionsSchema.safeParse({ size: '' }).success,
    false
  )
  assert.equal(
    publicVariantOptionsSchema.safeParse({ unknown: 'private' })
      .success,
    false
  )
})

test('Mini presentation preserves the cross-field uniqueness check and issue path', () => {
  const fixture = productPresentationDefinitions[0]!
  const result = productPresentationDefinitionSchema.safeParse({
    ...fixture,
    options: [fixture.options[0], fixture.options[0]]
  })
  assert.equal(result.success, false)
  if (result.success) return
  assert.deepEqual(result.error.issues, [
    {
      code: 'custom',
      path: ['options'],
      message: 'Option keys must be unique'
    }
  ])
})
