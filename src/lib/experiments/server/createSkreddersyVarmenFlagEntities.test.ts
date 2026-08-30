import assert from 'node:assert/strict'
import test from 'node:test'
import { createSkreddersyVarmenFlagEntities } from './createSkreddersyVarmenFlagEntities'

test('uses the documented Vercel user.id entity without exposing the raw analytics id', () => {
  const rawAnalyticsId = 'GA1.1.123456789.987654321'
  const entities =
    createSkreddersyVarmenFlagEntities(rawAnalyticsId)

  assert.deepEqual(Object.keys(entities.user), ['id'])
  assert.match(entities.user.id, /^[a-f0-9]{64}$/u)
  assert.doesNotMatch(
    JSON.stringify(entities),
    /GA1\.1\.123456789/u
  )
  assert.deepEqual(
    createSkreddersyVarmenFlagEntities(rawAnalyticsId),
    entities
  )
  assert.notEqual(
    createSkreddersyVarmenFlagEntities('GA1.1.different').user
      .id,
    entities.user.id
  )
})
