#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import metadata from './runtime-metadata.json' with { type: 'json' }
import { DOCS_INDEX, ROOT } from './lib/constants.mjs'

const MARKER_TAG = '@klarna-agent'

/**
 * @param {Record<string, string>} meta
 * @returns {string}
 */
function buildJSDoc(meta) {
  const lines = [
    '/**',
    ` * ${MARKER_TAG}`,
    ` * @id ${meta.id}`,
    ` * @title ${meta.title}`,
    ' * @domain Klarna',
    ` * @kind ${meta.kind}`,
    ` * @export ${meta.export}`,
    ` * @docs-index ${DOCS_INDEX}`
  ]
  if (meta['data-key']) lines.push(` * @data-key ${meta['data-key']}`)
  if (meta.locale) lines.push(` * @locale ${meta.locale}`)
  if (meta.dependencies) lines.push(` * @dependencies ${meta.dependencies}`)
  lines.push(' */')
  return lines.join('\n')
}

/**
 * @param {string} filePath
 * @param {string} rel
 * @param {Record<string, string>} meta
 */
function injectFile(filePath, rel, meta) {
  let content = readFileSync(filePath, 'utf8')
  const doc = buildJSDoc(meta)

  const agentBlock = new RegExp(
    `/\\*\\*[\\s\\S]*?\\* ${MARKER_TAG.replace('@', '\\@')}[\\s\\S]*?\\*/\\n?`,
    'm'
  )

  if (agentBlock.test(content)) {
    content = content.replace(agentBlock, `${doc}\n`)
  } else if (content.startsWith('\'use client\'') || content.startsWith('"use client"')) {
    const end = content.indexOf('\n') + 1
    content = `${content.slice(0, end)}\n${doc}\n${content.slice(end)}`
  } else {
    content = `${doc}\n${content}`
  }

  writeFileSync(filePath, content)
  console.log(`injected: ${rel}`)
}

for (const [rel, meta] of Object.entries(metadata.typescript)) {
  injectFile(join(ROOT, rel), rel, meta)
}

console.log(`Done: ${Object.keys(metadata.typescript).length} TypeScript files`)
