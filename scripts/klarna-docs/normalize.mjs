#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import {
  extractHeadingText,
  slugifyHeading,
  uniqueSlug,
  isHeadingLine,
  isTaggableHeading
} from '../google-docs/slugify.mjs'
import {
  BLOCKQUOTE,
  DEFAULT_AI_DIRECTIVE,
  DEFAULT_DOMAIN,
  DEFAULT_VERSION_TARGET,
  DOCS_INDEX,
  LAST_UPDATED,
  ROOT,
  SKIP_NORMALIZE
} from './lib/constants.mjs'
import { walkMd } from './lib/fs-walk.mjs'

const sources = JSON.parse(
  readFileSync(join(process.cwd(), 'scripts/klarna-docs/sources.json'), 'utf8')
)

/**
 * @param {string} rel
 * @returns {string | undefined}
 */
function inferUrl(rel) {
  if (sources[rel]) return sources[rel]

  const nextDocs = {
    'dev/docs/next-docs/ScriptComponent.md':
      'https://nextjs.org/docs/app/api-reference/components/script',
    'dev/docs/next-docs/Adapters.md':
      'https://nextjs.org/docs/app/api-reference/adapters/testing-adapters'
  }
  if (nextDocs[rel]) return nextDocs[rel]

  if (rel.includes('on-site-messaging/')) {
    return 'https://docs.klarna.com/marketing/on-site-messaging/'
  }
  if (rel.includes('web-payments/express-checkout/')) {
    return 'https://docs.klarna.com/payments/web-payments/express-checkout/'
  }
  if (rel.includes('web-payments/klarna-payments-integration/')) {
    return 'https://docs.klarna.com/payments/web-payments/integrate-with-klarna-payments/'
  }
  if (rel.includes('payment-api/')) {
    return 'https://docs.klarna.com/payments/payment-api/'
  }
  if (rel.includes('order-management/')) {
    return 'https://docs.klarna.com/payments/order-management/'
  }
  if (rel.includes('integration-resilience/')) {
    return 'https://docs.klarna.com/payments/integration-resilience/'
  }
  if (rel.includes('sign-in-with-klarna/')) {
    return 'https://docs.klarna.com/payments/sign-in-with-klarna/'
  }
  if (rel.includes('legal/')) {
    return 'https://docs.klarna.com/'
  }

  return undefined
}

/**
 * @param {string} rel
 * @returns {string}
 */
function inferKind(rel) {
  if (rel === 'README.md') return 'runtime-notes'
  if (rel.endsWith('/README.md')) return 'index'
  if (rel.startsWith('dev/docs/next-docs/')) return 'nextjs-mirror'
  if (rel === 'llms.md') return 'agent-index'
  if (rel === 'klarna-sitemap.md') return 'deprecated-index'
  if (rel.includes('/legal/')) return 'compliance'
  if (rel.startsWith('dev/docs/markdown/') || rel.startsWith('dev/markdown/')) {
    return 'klarna-mirror'
  }
  return 'notes'
}

/**
 * @param {string} rel
 * @returns {string}
 */
function inferTags(rel) {
  if (rel.includes('/legal/')) return 'compliance, norway'
  if (rel.includes('on-site-messaging/')) return 'osm, placements'
  if (rel.includes('express-checkout/')) return 'express-checkout'
  if (rel.includes('tokenized-payments/')) return 'token, recovery'
  return ''
}

/**
 * @param {string} content
 * @returns {{ yaml: Record<string, string>; body: string }}
 */
function parseFrontmatter(content) {
  /** @type {Record<string, string>} */
  const yaml = {}
  if (!content.startsWith('---\n')) {
    return { yaml, body: content }
  }
  const end = content.indexOf('\n---\n', 4)
  if (end === -1) {
    return { yaml, body: content }
  }
  const raw = content.slice(4, end)
  for (const line of raw.split('\n')) {
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/)
    if (m) {
      yaml[m[1]] = m[2].replace(/^['"]|['"]$/g, '').trim()
    }
  }
  return { yaml, body: content.slice(end + 5) }
}

/**
 * @param {string} body
 * @returns {string}
 */
function stripLeadingNoise(body) {
  let lines = body.split('\n')
  while (
    lines.length
    && (lines[0].trim() === ''
      || lines[0].startsWith('> Klarna agent index')
      || lines[0].startsWith('> Deprecated:'))
  ) {
    lines.shift()
  }
  return lines.join('\n')
}

/**
 * @param {string} line
 * @returns {boolean}
 */
function isSourceLine(line) {
  const t = line.trim()
  return t.startsWith('Source:') || t.startsWith('**Source:**')
}

/**
 * @param {string} body
 * @param {string} filename
 * @returns {string}
 */
function rewriteHeadings(body, filename) {
  const used = new Set()
  let h1Count = 0
  const lines = body.split('\n')
  /** @type {string[]} */
  const out = []

  for (const line of lines) {
    if (!isHeadingLine(line)) {
      out.push(line)
      continue
    }
    if (isTaggableHeading(line)) {
      if (/^#\s+/.test(line) && !/^##/.test(line)) h1Count++
      out.push(line)
      continue
    }

    const level = line.match(/^(#{1,4})/)?.[1] ?? '#'
    const text = extractHeadingText(line)
    const slug = uniqueSlug(slugifyHeading(text), used)

    if (level === '#') {
      h1Count++
      out.push(
        h1Count === 1 ? `# [${text}](./${filename})` : `# [${text}](#${slug})`
      )
    } else {
      out.push(`${level} [${text}](#${slug})`)
    }
  }

  return out.join('\n')
}

/**
 * @param {string} body
 * @returns {string | undefined}
 */
function extractDescription(body) {
  const lines = body.split('\n')
  let passedH1 = false
  for (const line of lines) {
    if (/^#\s+\[/.test(line)) {
      passedH1 = true
      continue
    }
    if (!passedH1) continue
    if (line.startsWith('Source:')) continue
    if (line.trim() === '' || line.startsWith('>') || line.startsWith('#')) continue
    const cleaned = line.replace(/`/g, '').trim()
    if (cleaned.length > 20) {
      return cleaned.length > 200 ? `${cleaned.slice(0, 197)}...` : cleaned
    }
  }
  return undefined
}

/**
 * @param {string} body
 * @param {string | undefined} url
 * @param {string} status
 * @returns {string}
 */
function insertSourceLine(body, url, status) {
  const lines = body.split('\n')
  const filtered = lines.filter(line => !isSourceLine(line))
  let result = filtered.join('\n').replace(/\n{3,}/g, '\n\n')

  if (url && status !== 'stub' && status !== 'duplicate') {
    const resultLines = result.split('\n')
    const h1Idx = resultLines.findIndex(l => /^#\s+\[/.test(l))
    if (h1Idx !== -1) {
      resultLines.splice(h1Idx + 1, 0, '', `Source: ${url}`)
      result = resultLines.join('\n')
    }
  }

  return result
}

/**
 * @param {Record<string, string>} yaml
 * @returns {string}
 */
function serializeFrontmatter(yaml) {
  const order = [
    'id',
    'title',
    'description',
    'url',
    'domain',
    'kind',
    'version_target',
    'version',
    'last_updated',
    'lastUpdated',
    'docs_index',
    'status',
    'tags',
    'dependencies',
    'prerequisites',
    'ai_directive'
  ]
  /** @type {string[]} */
  const lines = ['---']
  for (const key of order) {
    if (yaml[key] === undefined || yaml[key] === '') continue
    const val = yaml[key]
    if (['ai_directive', 'description', 'title', 'prerequisites'].includes(key)) {
      lines.push(`${key}: '${val.replace(/'/g, '\'\'')}'`)
    } else {
      lines.push(`${key}: '${val}'`)
    }
  }
  lines.push('---')
  return lines.join('\n')
}

/**
 * @param {string} rel
 * @returns {string}
 */
function inferId(rel, existing) {
  if (existing) return existing
  const base = basename(rel).replace(/\.md\.md$/, '.md').replace(/\.md$/, '')
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function normalizeFile(filePath) {
  const rel = relative(ROOT, filePath)
  const filename = basename(filePath)
  const raw = readFileSync(filePath, 'utf8')
  const { yaml: existing, body: rawBody } = parseFrontmatter(raw)

  let body = stripLeadingNoise(rawBody)
  body = rewriteHeadings(body, filename)

  if (!body.split('\n').some(line => /^#\s+/.test(line) && !/^##/.test(line))) {
    const humanized = basename(filename, '.md')
      .replace(/\.md$/, '')
      .split(/[-_]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    body = `# [${humanized}](./${filename})\n\n${body.trim()}`
  }

  const firstH1 =
    body.match(/^#\s+\[(.+?)\]\(\.\//m)?.[1] ?? basename(filename, '.md')
  const status = existing.status ?? 'complete'
  const url = existing.url ?? inferUrl(rel)
  const kind = existing.kind ?? inferKind(rel)
  const tags = existing.tags ?? inferTags(rel)
  const deps = existing.dependencies ?? (dirname(rel) === '.' ? '' : dirname(rel))

  /** @type {Record<string, string>} */
  const yaml = {
    id: inferId(rel, existing.id),
    title: existing.title ?? firstH1,
    description:
      existing.description ?? extractDescription(body) ?? `Local Klarna mirror: ${firstH1}`,
    domain: existing.domain ?? DEFAULT_DOMAIN,
    kind,
    version_target: existing.version_target ?? DEFAULT_VERSION_TARGET,
    last_updated: existing.last_updated ?? existing.lastUpdated ?? LAST_UPDATED,
    docs_index: DOCS_INDEX,
    status,
    ai_directive: existing.ai_directive ?? DEFAULT_AI_DIRECTIVE
  }

  if (url) yaml.url = url
  if (tags) yaml.tags = tags
  if (existing.version) yaml.version = existing.version
  if (existing.lastUpdated && !existing.last_updated) yaml.lastUpdated = existing.lastUpdated
  if (existing.prerequisites) yaml.prerequisites = existing.prerequisites
  if (deps && deps !== '.') yaml.dependencies = deps

  body = insertSourceLine(body, url, status)

  return `${serializeFrontmatter(yaml)}\n\n${BLOCKQUOTE}\n\n${body.trim()}\n`
}

const args = process.argv.slice(2)
const write = args.includes('--write')
const check = args.includes('--check')

const files = walkMd().filter(f => {
  const rel = relative(ROOT, f)
  return !SKIP_NORMALIZE.has(basename(rel))
})

let changed = 0
for (const file of files) {
  const before = readFileSync(file, 'utf8')
  const after = normalizeFile(file)
  if (before !== after) {
    changed++
    if (write) {
      writeFileSync(file, after)
      console.log(`updated: ${relative(ROOT, file)}`)
    } else if (check) {
      console.log(`would update: ${relative(ROOT, file)}`)
    }
  }
}

console.log(
  `${write ? 'Updated' : check ? 'Would update' : 'Processed'} ${changed}/${files.length} files`
)
if (check && changed > 0) process.exit(1)
