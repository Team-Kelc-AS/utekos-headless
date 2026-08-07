#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { basename, relative } from 'node:path'
import { isHeadingLine, isTaggableHeading } from '../google-docs/slugify.mjs'
import { BLOCKQUOTE, DOCS_INDEX, ROOT, SKIP_NORMALIZE } from './lib/constants.mjs'
import { walkMd } from './lib/fs-walk.mjs'

/**
 * @param {string} content
 * @returns {{ yaml: string | null; body: string }}
 */
function splitFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return { yaml: null, body: content }
  }
  const end = content.indexOf('\n---\n', 4)
  if (end === -1) {
    return { yaml: null, body: content }
  }
  return {
    yaml: content.slice(4, end),
    body: content.slice(end + 5)
  }
}

/**
 * @param {string} yaml
 * @param {string} key
 * @returns {string | undefined}
 */
function getYamlValue(yaml, key) {
  const match = yaml.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
  if (!match) return undefined
  return match[1].replace(/^['"]|['"]$/g, '').trim()
}

/**
 * @param {string} filePath
 * @param {string} content
 * @returns {string[]}
 */
function validateFile(filePath, content) {
  const rel = relative(ROOT, filePath)
  /** @type {string[]} */
  const errors = []
  const { yaml, body } = splitFrontmatter(content)

  if (!yaml) {
    errors.push('missing YAML frontmatter')
    return errors.map(e => `${rel}: ${e}`)
  }

  for (const key of ['docs_index', 'title', 'last_updated']) {
    if (!getYamlValue(yaml, key) && !getYamlValue(yaml, 'lastUpdated')) {
      if (key === 'last_updated' && getYamlValue(yaml, 'lastUpdated')) continue
      errors.push(`frontmatter missing ${key}`)
    }
  }

  const docsIndex = getYamlValue(yaml, 'docs_index')
  if (docsIndex !== DOCS_INDEX) {
    errors.push(`docs_index must be ${DOCS_INDEX}, got ${docsIndex ?? 'undefined'}`)
  }

  if (!body.includes(BLOCKQUOTE)) {
    errors.push('missing agents.txt blockquote')
  }

  for (const line of body.split('\n')) {
    if (isHeadingLine(line) && !isTaggableHeading(line)) {
      errors.push(`untagged heading: ${line.slice(0, 80)}`)
    }
  }

  const status = getYamlValue(yaml, 'status')
  const url = getYamlValue(yaml, 'url')
  if (url && status !== 'stub' && status !== 'duplicate') {
    const sourceLines = body.split('\n').filter(l => l.startsWith('Source: '))
    if (sourceLines.length !== 1) {
      errors.push(`expected exactly one Source: line, found ${sourceLines.length}`)
    } else if (sourceLines[0] !== `Source: ${url}`) {
      errors.push(`Source line mismatch: ${sourceLines[0]}`)
    }
  }

  return errors.map(e => `${rel}: ${e}`)
}

const files = walkMd().filter(f => !SKIP_NORMALIZE.has(basename(relative(ROOT, f))))

/** @type {string[]} */
const allErrors = []
for (const file of files) {
  allErrors.push(...validateFile(file, readFileSync(file, 'utf8')))
}

if (allErrors.length) {
  console.error(`Validation failed (${allErrors.length} issues):\n`)
  for (const err of allErrors.slice(0, 100)) {
    console.error(`  - ${err}`)
  }
  if (allErrors.length > 100) {
    console.error(`  ... and ${allErrors.length - 100} more`)
  }
  process.exit(1)
}

console.log(`OK: ${files.length} markdown file(s) compliant`)
