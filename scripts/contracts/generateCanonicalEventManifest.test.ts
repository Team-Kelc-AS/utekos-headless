import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { canonicalEventSchema } from '../../src/lib/analytics/canonicalEvent'
import { eventCatalog } from '../../src/lib/analytics/eventCatalog'
import {
  canonicalEventManifestSchema,
  generateCanonicalEventManifest
} from './generateCanonicalEventManifest'

const root = resolve(import.meta.dirname, '../..')
const manifestPath = resolve(
  root,
  'contracts/events/canonical-event-manifest/v1/canonical-event-manifest.v1.json'
)
const checksumPath = resolve(
  root,
  'contracts/events/canonical-event-manifest/v1/canonical-event-manifest.v1.sha256'
)

test('canonical manifest artifacts are generated from their normative sources', () => {
  assert.doesNotThrow(() => generateCanonicalEventManifest(true))
})

test('canonical manifest covers the full schema union and separates catalog-only entries', () => {
  const manifest = canonicalEventManifestSchema.parse(
    JSON.parse(readFileSync(manifestPath, 'utf8'))
  )
  assert.deepEqual(
    manifest.events.map(event => event.name),
    canonicalEventSchema.options.map(
      schema =>
        schema._zod.def.shape.event_name._zod.def.values[0]
    )
  )
  assert.equal(
    manifest.events.length + manifest.catalog_only.length,
    Object.keys(eventCatalog).length
  )
  assert(
    manifest.catalog_only.every(
      event =>
        event.membership === 'catalog_only' &&
        !manifest.events.some(
          canonical => canonical.name === event.name
        )
    )
  )
  assert.equal(
    manifest.events.find(
      event => event.name === 'meta_app_event'
    )?.schema.source,
    'src/lib/analytics/metaNonWebCanonicalEvent.ts'
  )
  assert.equal(
    manifest.events.find(event => event.name === 'purchase')
      ?.contract.route,
    null
  )
  assert.deepEqual(manifest.tracking_authorization, {
    mode: 'operator_policy',
    version: 'operator-policy-v1',
    authorization: {
      analytics: 'granted',
      marketing: 'granted',
      preferences: 'granted'
    },
    cookiebot_state: 'not_used_for_tracking_authorization'
  })
  for (const event of manifest.events) {
    assert.equal(event.membership, 'canonical')
    assert.equal(event.evidence.static, 'static_verified')
    assert.equal(event.evidence.runtime, 'not_queried')
    assert.equal(event.evidence.provider_accepted, 'not_queried')
    assert.equal(event.evidence.provider_reported, 'not_queried')
    assert(
      manifest.generated_from.source_files.some(
        source => source.path === event.schema.source
      )
    )
    assert(
      event.parameter_lineage.every(
        line => line.source.length > 0 && line.rule.length > 0
      )
    )
  }
})

test('canonical manifest checksum binds the exact generated JSON bytes', () => {
  const content = readFileSync(manifestPath)
  const actual = createHash('sha256')
    .update(content)
    .digest('hex')
  assert.equal(
    readFileSync(checksumPath, 'utf8'),
    `${actual}  canonical-event-manifest.v1.json\n`
  )
})
