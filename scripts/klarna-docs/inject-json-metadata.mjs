#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import metadata from './runtime-metadata.json' with { type: 'json' }
import { DOCS_INDEX, ROOT } from './lib/constants.mjs'

/**
 * @param {string} filePath
 * @param {string} rel
 * @param {{ id: string; title: string; tags: string[] }} meta
 */
function injectJson(filePath, rel, meta) {
  const raw = readFileSync(filePath, 'utf8')
  const data = JSON.parse(raw)

  data['x-klarna-agent'] = {
    id: meta.id,
    title: meta.title,
    domain: 'Klarna',
    docs_index: DOCS_INDEX,
    tags: meta.tags
  }

  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
  console.log(`injected: ${rel}`)
}

for (const [rel, meta] of Object.entries(metadata.json)) {
  injectJson(join(ROOT, rel), rel, meta)
}

console.log(`Done: ${Object.keys(metadata.json).length} JSON files`)
