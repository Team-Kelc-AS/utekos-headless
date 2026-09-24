import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  ORGANIZATION_ID,
  buildOrganizationJsonLd
} from './organizationJsonLd'

test('Organization node carries contactPoint and postal address', () => {
  const json = JSON.parse(JSON.stringify(buildOrganizationJsonLd())) as Record<string, unknown>
  assert.equal(json['@type'], 'Organization')
  assert.equal(json['@id'], ORGANIZATION_ID)
  assert.equal(json['@id'], 'https://utekos.no/#organization')
  assert.ok(typeof json.name === 'string' && json.name.length > 0)
  assert.ok(typeof json.url === 'string' && json.url.length > 0)

  const contact = json.contactPoint
  assert.ok(contact !== undefined && typeof contact === 'object')
  const contactRecord = contact as Record<string, unknown>
  assert.equal(contactRecord['@type'], 'ContactPoint')
  assert.ok(typeof contactRecord.email === 'string' && (contactRecord.email as string).includes('@'))
  assert.ok(typeof contactRecord.telephone === 'string' && (contactRecord.telephone as string).length > 0)
  assert.ok(typeof contactRecord.contactType === 'string' && (contactRecord.contactType as string).length > 0)

  const address = json.address
  assert.ok(address !== undefined && typeof address === 'object')
  assert.equal((address as Record<string, unknown>)['@type'], 'PostalAddress')

  assert.ok(Array.isArray(json.sameAs) && json.sameAs.length > 0)
})

test('store layout emits a graph with both Organization and OnlineStore', () => {
  const component = readFileSync(
    new URL('../../app/OnlineStoreJsonLd.tsx', import.meta.url),
    'utf8'
  )
  assert.match(component, /'@graph'/)
  assert.match(component, /buildOrganizationJsonLd\(\), onlineStoreNode/)
  assert.match(component, /'@type': 'OnlineStore'/)
  const builder = readFileSync(
    new URL('./organizationJsonLd.ts', import.meta.url),
    'utf8'
  )
  assert.match(builder, /'@type': 'Organization'/)
})
