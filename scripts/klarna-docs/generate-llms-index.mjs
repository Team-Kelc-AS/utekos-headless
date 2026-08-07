#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import metadata from './runtime-metadata.json' with { type: 'json' }
import {
  DEFAULT_VERSION_TARGET,
  DOCS_INDEX,
  LLMS_INDEX,
  PARENT_INDEX,
  ROOT
} from './lib/constants.mjs'
import {
  domainGroup,
  relFromRoot,
  walkAll,
  walkMd
} from './lib/fs-walk.mjs'

const SITEMAP_PATH = join(ROOT, 'klarna-sitemap.md')
const LLMS_PATH = join(ROOT, 'llms.md')
const generatedAt = new Date().toISOString()

const allFiles = walkAll()
const mdFiles = walkMd()
const runtimeFiles = allFiles.filter(f => /\.(ts|tsx)$/.test(f))
const openapiFiles = allFiles.filter(f => {
  const rel = relFromRoot(f)
  return (
    rel.startsWith('dev/docs/json/API/') &&
    rel.endsWith('.json') &&
    !rel.includes('/Extra-Merchant-Data-EMD/')
  )
})
const schemaFiles = allFiles.filter(f => {
  const rel = relFromRoot(f)
  return (
    (rel.startsWith('dev/docs/SCHEMAS/') ||
      rel.includes('/Extra-Merchant-Data-EMD/json/')) &&
    rel.endsWith('.json')
  )
})

/**
 * @param {string} sitemap
 * @returns {string}
 */
function extractNarrative(sitemap) {
  const startMatch = sitemap.match(
    /^## (?:\[)?Rask orientering/m
  )
  const start = startMatch ? sitemap.indexOf(startMatch[0]) : -1
  const filetreeMatch = sitemap.match(
    /^## (?:\[)?Fullt filetree/m
  )
  const filetreeStart =
    filetreeMatch ? sitemap.indexOf(filetreeMatch[0]) : -1
  const dokumentkartMatch = sitemap.match(
    /^## (?:\[)?Dokumentkart/m
  )
  const dokumentkartStart =
    dokumentkartMatch ?
      sitemap.indexOf(dokumentkartMatch[0])
    : -1
  const minimalMatch = sitemap.match(
    /^## (?:\[)?Minimal agentoppskrift/m
  )
  const minimalStart =
    minimalMatch ? sitemap.indexOf(minimalMatch[0]) : -1

  if (start === -1) return ''

  const beforeFiletree = sitemap.slice(
    start,
    filetreeStart > start ? filetreeStart : dokumentkartStart
  )
  const afterFiletree =
    dokumentkartStart !== -1 && minimalStart !== -1 ?
      sitemap.slice(dokumentkartStart, minimalStart)
    : ''

  let narrative =
    `${beforeFiletree.trim()}\n\n${afterFiletree.trim()}`.trim()

  narrative = narrative.replace(
    '│   ├── KlarnaSDKComponent.tsx',
    '│   ├── KlarnaOnSiteMessagingScript.tsx\n│   ├── KlarnaSDKComponent.tsx'
  )

  if (!narrative.includes('KlarnaOnSiteMessagingScript')) {
    narrative = narrative.replace(
      '| `[components/KlarnaSDKComponent.tsx]',
      '| `[components/KlarnaOnSiteMessagingScript.tsx](components/KlarnaOnSiteMessagingScript.tsx)` | `KlarnaOnSiteMessagingScript` | OSM script loader via `next/script` | `strategy="afterInteractive"` |\n| `[components/KlarnaSDKComponent.tsx]'
    )
  }

  if (!narrative.includes('getKlarnaMinorUnitAmount')) {
    narrative = narrative.replace(
      '| `[utils/klarnaCdnApiUrl.ts]',
      '| `[utils/getKlarnaMinorUnitAmount.ts](utils/getKlarnaMinorUnitAmount.ts)` | `getKlarnaMinorUnitAmount` | Minor unit amount helper | Used on product pages |\n| `[utils/klarnaCdnApiUrl.ts]'
    )
  }

  return narrative
}

/**
 * @returns {string}
 */
function buildMachineHeader() {
  return `@doc-root: src/components/klarna
@doc-format: local-relative
@docs_index: ${DOCS_INDEX}
@llms_index: ${LLMS_INDEX}
@parent_index: ${PARENT_INDEX}
@doc-generated: ${generatedAt}
@doc-files: ${allFiles.length}
@runtime-files: ${runtimeFiles.length}
@markdown-files: ${mdFiles.length}
@openapi-files: ${openapiFiles.length}
@schema-files: ${schemaFiles.length}
@locale: no-NO
@version_target: ${DEFAULT_VERSION_TARGET}
@ai_directive: ZERO-ASSUMPTION — les docs_index før API/SDK-endringer. Valider payloads med Zod.`
}

/**
 * @param {string} rel
 * @returns {string}
 */
function fileDescription(rel) {
  const name = basename(rel)
  if (metadata.typescript[rel])
    return metadata.typescript[rel].title
  if (metadata.json[rel]) return metadata.json[rel].title
  if (name === 'README.md') return 'Index or developer notes'
  if (name === 'llms.md')
    return 'Kanonisk agent-indeks for Klarna-domene'
  if (name === 'agents.txt') return 'Domene-routing for agenter'
  if (name === 'klarna-sitemap.md')
    return 'Deprecated navigasjonsindeks — bruk llms.md'
  return `Local Klarna file: ${name}`
}

/**
 * @returns {string}
 */
function buildFlatIndex() {
  /** @type {Map<string, { rel: string; desc: string }[]>} */
  const groups = new Map()

  for (const file of allFiles) {
    const rel = relFromRoot(file)
    const group = domainGroup(rel)
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)?.push({ rel, desc: fileDescription(rel) })
  }

  const sortedGroups = [...groups.keys()].sort((a, b) =>
    a.localeCompare(b)
  )
  /** @type {string[]} */
  const lines = ['## Flat filindeks']

  for (const group of sortedGroups) {
    const items =
      groups
        .get(group)
        ?.sort((a, b) => a.rel.localeCompare(b.rel)) ?? []
    lines.push('', `### ${group}`, '')
    for (const { rel, desc } of items) {
      lines.push(`- [${basename(rel)}](${rel}): ${desc}`)
    }
  }

  return lines.join('\n')
}

/**
 * @returns {string}
 */
function buildRuntimeIndex() {
  const rows = Object.entries(metadata.typescript)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([rel, meta]) => {
      const grep = `rg '${meta.export}' src/`
      const dataKey = meta['data-key'] ?? '—'
      return `| [\`${rel}\`](${rel}) | \`${meta.export}\` | ${meta.kind} | ${dataKey} | \`${grep}\` |`
    })

  return `## Runtime-indeks (kode)

| Fil | Export | Kind | data-key | grep |
| --- | --- | --- | --- | --- |
${rows.join('\n')}`
}

/**
 * @returns {string}
 */
function buildOpenApiIndex() {
  const rows = Object.entries(metadata.json)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([rel, meta]) => {
      return `| [\`${basename(rel)}\`](${rel}) | \`${meta.tags.join(', ')}\` | ${meta.title} |`
    })

  return `## OpenAPI og JSON-skjema

| Fil | x-klarna-agent tags | Primær bruk |
| --- | --- | --- |
${rows.join('\n')}`
}

/**
 * @returns {string}
 */
function buildSearchSyntax() {
  return `## AST- og søkesyntaks (Codex + Cursor)

| Mål | Cursor (ripgrep/Glob) | Codex (MCP / shell) |
| --- | --- | --- |
| Finn domene-indeks | \`rg 'docs_index:.*klarna' src/components/klarna\` | \`project_locate\` query: \`klarna payments OSM\` |
| Seksjon i doc | \`rg '^\\\\#{1,4} \\\\[.*[Cc]apture' src/components/klarna\` | \`read_project_files\` med path fra llms.md |
| Placement key | \`rg 'data-key=' src/components/klarna/components\` | \`rg\` via shell |
| OpenAPI path | \`rg '"/payments/v1/sessions"' src/components/klarna/dev/docs/json\` | JSON path fra indeks |
| Live API (fallback) | Context7: \`ctx7 library klarna "payments session"\` | Samme — begge agenter |
| Heading-anker | \`rg '\\\\](#initiate-a-payment\\\\)'\` | Tagged headings etter normalize |
| TS export | \`rg '@klarna-agent' src/components/klarna\` | \`read_project_files\` |
| Runtime metadata | \`rg 'x-klarna-agent' src/components/klarna/dev/docs\` | JSON path fra indeks |

**Tagged headings** (etter \`npm run normalize:klarna-docs\`):

\`\`\`markdown
# [Initiate a Payment](./Initiate-a-payment.md)
## [Session payload](#session-payload)
\`\`\`

Grep: \`rg '^\\\\#{1,4} \\\\[' src/components/klarna/dev/docs\`

### Agentkontrakt

Begge agenter (Cursor og Codex) starter med [agents.txt](./agents.txt), bruker denne filen som flat indeks, og MÅ kjøre \`npm run validate:klarna-docs\` etter doc-endringer.`
}

/**
 * @returns {string}
 */
function buildFileTree() {
  /** @type {Record<string, string[]>} */
  const tree = {}

  for (const file of allFiles) {
    const rel = relFromRoot(file)
    const parts = rel.split('/')
    let node = tree
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (i === parts.length - 1) {
        if (!node.__files) node.__files = []
        node.__files.push(part)
      } else {
        if (!node[part]) node[part] = {}
        node = node[part]
      }
    }
  }

  /**
   * @param {Record<string, unknown>} node
   * @param {string} prefix
   * @returns {string[]}
   */
  function render(node, prefix) {
    /** @type {string[]} */
    const lines = []
    const dirs = Object.keys(node)
      .filter(k => k !== '__files')
      .sort()
    const files = (node.__files ?? []).sort()

    for (const dir of dirs) {
      lines.push(`${prefix}${dir}/`)
      lines.push(...render(node[dir], `${prefix}  `))
    }
    for (const file of files) {
      lines.push(`${prefix}${file}`)
    }
    return lines
  }

  return `## Fullt filetree

\`\`\`text
src/components/klarna
${render(tree, '')
  .map(l =>
    l.startsWith('  ') || l.includes('/') ? `  ${l}` : `├── ${l}`
  )
  .join('\n')}
\`\`\``
}

/**
 * @returns {string}
 */
function buildMinimalRecipe() {
  return `## Minimal agentoppskrift

1. Identifiser oppgaven i tabellen «Arbeidsflyt for agenter».
2. Les den konkrete implementeringsfilen fra runtime-indeksen.
3. Les bare relevante lokale Klarna-docs fra «Dokumentkart» eller flat filindeks.
4. Hvis oppgaven endrer API-, SDK-, Next.js- eller betalingslogikk: hent oppdatert dokumentasjon for nøyaktig API-form før implementering.
5. Implementer smalt, med Zod-validering for alle nye payloads eller tool-schemas.
6. Kjør \`npm run validate:klarna-docs\` etter doc-endringer.
7. Test importstier og TypeScript etter kodeendring.

---

For routing fra repo-root: [docs/agents.txt](/docs/agents.txt)
For Klarna-domene: [agents.txt](./agents.txt)
For komplett filindeks: denne filen (\`llms.md\`)`
}

const sitemap = readFileSync(SITEMAP_PATH, 'utf8')
const narrative = extractNarrative(sitemap)

const content = `# Klarna agent-sitemap

${buildMachineHeader()}

${narrative}

${buildRuntimeIndex()}

${buildOpenApiIndex()}

${buildSearchSyntax()}

${buildFileTree()}

${buildFlatIndex()}

${buildMinimalRecipe()}
`

writeFileSync(LLMS_PATH, content)
console.log(
  `Wrote ${relative(process.cwd(), LLMS_PATH)} (${allFiles.length} files indexed)`
)
