import assert from 'node:assert/strict'
import test from 'node:test'

import { getSchemaOrgGtinData } from '@/lib/gtin/getSchemaOrgGtinData'
import { getSchemaOrgGtinProperty } from '@/lib/gtin/getSchemaOrgGtinProperty'
import { isValidGtin } from '@/lib/gtin/isValidGtin'
import { normalizeGtin } from '@/lib/gtin/normalizeGtin'

test('validates supported GTIN lengths with checksum', () => {
  assert.equal(isValidGtin('96385074'), true)
  assert.equal(isValidGtin('036000291452'), true)
  assert.equal(isValidGtin('5901234123457'), true)
  assert.equal(isValidGtin('07090062980115'), true)
})

test('rejects malformed or checksum-invalid GTIN values', () => {
  assert.equal(isValidGtin('07090062980116'), false)
  assert.equal(isValidGtin('1234'), false)
  assert.equal(isValidGtin(null), false)
})

test('normalizes GTIN and selects the Schema.org GTIN property', () => {
  assert.equal(normalizeGtin(' 0709-0062980115 '), '07090062980115')
  assert.equal(getSchemaOrgGtinProperty('96385074'), 'gtin8')
  assert.equal(getSchemaOrgGtinProperty('036000291452'), 'gtin12')
  assert.equal(getSchemaOrgGtinProperty('5901234123457'), 'gtin13')
  assert.equal(getSchemaOrgGtinProperty('07090062980115'), 'gtin14')
  assert.deepEqual(getSchemaOrgGtinData('07090062980115'), {
    gtin14: '07090062980115'
  })
})
