import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const FORBIDDEN_FRAGMENTS = [
  'runRegisteredProviderOutboxBatch',
  'scheduleAfter',
  'runBatch',
  'IMMEDIATE_BATCH_SIZE',
  '-outbox-after',
  'after('
]

const REQUIRED_FRAGMENTS = [
  'handleCanonicalViewCartRoute',
  'handleCanonicalViewCartRequest',
  'collect:',
  'getRequestContext:',
  'store: postgresCanonicalEventStore',
  'from \'@vercel/functions\''
]

async function loadGenerator() {
  const generatorUrl = pathToFileURL(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      'generate-phase2-canonical-events.mjs'
    )
  ).href
  return import(generatorUrl)
}

test('generated API routes omit request-path provider dispatch wiring', async () => {
  const { generateApiRoute } = await loadGenerator()
  assert.equal(typeof generateApiRoute, 'function')

  const tempRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'ce-1.4c6-generator-')
  )

  try {
    const sampleEvent = {
      name: 'view_cart',
      commerce: true,
      meta: null,
      pageViewRequired: true
    }
    const generated = generateApiRoute(sampleEvent)
    const outFile = path.join(
      tempRoot,
      'src/app/api/events/view-cart/route.ts'
    )
    fs.mkdirSync(path.dirname(outFile), { recursive: true })
    fs.writeFileSync(outFile, generated)

    const onDisk = fs.readFileSync(outFile, 'utf8')

    for (const fragment of FORBIDDEN_FRAGMENTS) {
      assert.equal(
        onDisk.includes(fragment),
        false,
        `generated handler must not contain ${JSON.stringify(fragment)}`
      )
    }

    for (const fragment of REQUIRED_FRAGMENTS) {
      assert.equal(
        onDisk.includes(fragment),
        true,
        `generated handler must retain ${JSON.stringify(fragment)}`
      )
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  }
})
