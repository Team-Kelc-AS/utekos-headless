import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const shopifyDir = dirname(fileURLToPath(import.meta.url))

const spanSources = [
  'processDunWaitlistShopifyQueueMessage.ts',
  'readDunWaitlistShopifyQueue.ts',
  'archiveDunWaitlistShopifyQueueMessage.ts',
  'setDunWaitlistShopifyQueueVisibility.ts',
  'deadLetterDunWaitlistShopifyQueueMessage.ts'
]

test('Dun PGMQ OpenTelemetry span attributes exclude PII and lead_id', () => {
  for (const fileName of spanSources) {
    const source = readFileSync(join(shopifyDir, fileName), 'utf8')
    const attributesBlocks = [
      ...source.matchAll(/attributes:\s*\{([\s\S]*?)\}/g)
    ].map(match => {
      const block = match[1]
      assert.equal(typeof block, 'string')
      return block as string
    })

    assert.ok(
      attributesBlocks.length > 0,
      `${fileName} should define span attributes`
    )

    for (const block of attributesBlocks) {
      assert.doesNotMatch(block, /email/i)
      assert.doesNotMatch(block, /phone/i)
      assert.doesNotMatch(block, /firstName|first_name|last_name/i)
      assert.doesNotMatch(block, /['"]lead_id['"]/)
      assert.doesNotMatch(block, /leadId:/)
      assert.doesNotMatch(block, /access[_-]?token/i)
      assert.doesNotMatch(block, /raw.*shopify|shopify.*response/i)
    }
  }
})
