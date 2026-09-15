#!/usr/bin/env node

import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

const DEFAULT_INPUT = 'artifacts/theme/runtime-contrast-report.json'
const DEFAULT_JSON_OUTPUT = 'artifacts/theme/runtime-contrast-groups.json'
const DEFAULT_MARKDOWN_OUTPUT = 'artifacts/theme/runtime-contrast-groups.md'
const SOURCE_ROOTS = ['src']
const SOURCE_EXTENSIONS = new Set([
  '.css',
  '.js',
  '.jsx',
  '.md',
  '.mdx',
  '.ts',
  '.tsx'
])
const MAX_SOURCE_FILES_PER_FINDING = 8
const MAX_TOP_GROUPS = 20
const MAX_BATCHES = 12

function argValue(name, fallback) {
  const prefix = `${name}=`
  const match = process.argv.find(argument => argument.startsWith(prefix))

  return match ? match.slice(prefix.length) : fallback
}

function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function normalizeNeedle(value) {
  return normalizeWhitespace(value).toLowerCase()
}

function unescapeCssSelectorToken(value) {
  return value
    .replace(/\\\\/g, '\\')
    .replace(/\\:/g, ':')
    .replace(/\\\//g, '/')
    .replace(/\\\./g, '.')
    .replace(/\\/g, '')
}

function extractSelectorSignals(selector) {
  const raw = String(selector ?? '')
  const signals = new Set()
  const dataAttributes = raw.matchAll(/\[(data-[\w-]+)=["']([^"']+)["']\]/g)

  for (const match of dataAttributes) {
    signals.add(match[1])
    signals.add(match[2])
    signals.add(`${match[1]}="${match[2]}"`)
  }

  const idMatch = raw.match(/#([A-Za-z][\w-]*)/)

  if (idMatch) {
    signals.add(idMatch[1])
  }

  const classMatches = raw.matchAll(/\.((?:\\.|[^.#:[\s>+~])+)/g)

  for (const match of classMatches) {
    const token = unescapeCssSelectorToken(match[1])

    if (token.length >= 3) {
      signals.add(token)
    }
  }

  return Array.from(signals)
}

function routeOwners(route) {
  if (route === '/') {
    return [
      'src/app/(home)',
      'src/components/frontpage',
      'src/components/header',
      'src/components/footer',
      'src/components/ui'
    ]
  }

  if (route === '/produkter') {
    return [
      'src/app/(store)/produkter/(oversikt)',
      'src/components/ProductCard',
      'src/components/ProductGrid',
      'src/components/ui'
    ]
  }

  if (route.startsWith('/produkter/')) {
    return [
      'src/app/(store)/produkter/[handle]',
      'src/components/ProductPage',
      'src/components/ProductCard',
      'src/components/ui'
    ]
  }

  const segments = route.split('/').filter(Boolean)

  if (segments.length === 0) {
    return ['src/app']
  }

  return [`src/app/${segments.join('/')}`, `src/app/${segments[0]}`, 'src/components/ui']
}

function routeOwnerScore(filePath, route) {
  const owners = routeOwners(route)
  const normalizedPath = filePath.split(path.sep).join('/')

  for (const owner of owners) {
    if (normalizedPath.startsWith(owner)) {
      return owner === 'src/components/ui' ? 2 : 4
    }
  }

  return 0
}

function componentFamilyFor(filePath) {
  const normalizedPath = filePath.split(path.sep).join('/')
  const parts = normalizedPath.split('/')

  if (normalizedPath.startsWith('src/app/')) {
    const routeGroup = parts.slice(2, 5).join('/')

    return `app/${routeGroup}`
  }

  if (normalizedPath.startsWith('src/components/')) {
    return `components/${parts[2] ?? 'unknown'}`
  }

  if (normalizedPath === 'src/globals.css') {
    return 'theme/globals'
  }

  return parts.slice(0, 3).join('/')
}

function groupKeyForFinding(finding) {
  return [
    finding.route ?? 'unknown-route',
    finding.mode ?? 'unknown-mode',
    finding.selector ?? 'unknown-selector',
    normalizeWhitespace(finding.text ?? '')
  ].join(' | ')
}

function severityScore(finding) {
  const required = Number(finding.required)
  const ratio = Number(finding.ratio)

  if (!Number.isFinite(required) || !Number.isFinite(ratio)) {
    return 1
  }

  return Math.max(0.1, required - ratio)
}

async function pathExists(filePath) {
  try {
    await stat(filePath)

    return true
  } catch {
    return false
  }
}

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.next' ||
        entry.name === '.git'
      ) {
        continue
      }

      files.push(...(await collectSourceFiles(absolutePath)))
      continue
    }

    if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(absolutePath)
    }
  }

  return files
}

async function loadSourceIndex() {
  const absoluteFiles = []

  for (const root of SOURCE_ROOTS) {
    const absoluteRoot = path.join(repoRoot, root)

    if (await pathExists(absoluteRoot)) {
      absoluteFiles.push(...(await collectSourceFiles(absoluteRoot)))
    }
  }

  const files = []

  for (const absolutePath of absoluteFiles) {
    const content = await readFile(absolutePath, 'utf8')
    const relativePath = path.relative(repoRoot, absolutePath)

    files.push({
      path: relativePath,
      content,
      normalizedContent: normalizeNeedle(content)
    })
  }

  return files
}

function scoreFileForFinding(sourceFile, finding) {
  let score = routeOwnerScore(sourceFile.path, finding.route)
  const reasons = []
  const text = normalizeWhitespace(finding.text ?? '')
  const normalizedText = normalizeNeedle(text)

  if (score > 0) {
    reasons.push('route-owner')
  }

  if (normalizedText.length >= 8 && sourceFile.normalizedContent.includes(normalizedText)) {
    score += 12
    reasons.push('exact-text')
  } else if (normalizedText.length >= 16) {
    const words = normalizedText
      .split(/\s+/)
      .filter(word => word.length >= 5)
      .slice(0, 6)
    const matchedWords = words.filter(word => sourceFile.normalizedContent.includes(word))

    if (matchedWords.length >= Math.min(3, words.length)) {
      score += matchedWords.length * 2
      reasons.push('text-words')
    }
  }

  for (const signal of extractSelectorSignals(finding.selector)) {
    const normalizedSignal = normalizeNeedle(signal)

    if (normalizedSignal.length >= 3 && sourceFile.normalizedContent.includes(normalizedSignal)) {
      score += signal.startsWith('data-') || signal.includes('=') ? 6 : 3
      reasons.push(`selector:${signal}`)
    }
  }

  return { score, reasons: Array.from(new Set(reasons)) }
}

function candidatesForFinding(sourceFiles, finding) {
  return sourceFiles
    .map(sourceFile => ({
      file: sourceFile.path,
      family: componentFamilyFor(sourceFile.path),
      ...scoreFileForFinding(sourceFile, finding)
    }))
    .filter(candidate => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.file.localeCompare(right.file))
    .slice(0, MAX_SOURCE_FILES_PER_FINDING)
}

function createStatus(report, failures, concerns) {
  if (!report) {
    return 'NEEDS_CONTEXT'
  }

  if (!Array.isArray(failures)) {
    return 'NEEDS_CONTEXT'
  }

  if (failures.length === 0) {
    return 'DONE'
  }

  return concerns.length > 0 ? 'DONE_WITH_CONCERNS' : 'DONE'
}

function buildGroups(failures, sourceFiles) {
  const groups = new Map()
  const batches = new Map()

  for (const finding of failures) {
    const key = groupKeyForFinding(finding)
    const candidates = candidatesForFinding(sourceFiles, finding)
    const topCandidate = candidates[0]
    const severity = severityScore(finding)

    if (!groups.has(key)) {
      groups.set(key, {
        route: finding.route ?? null,
        mode: finding.mode ?? null,
        selector: finding.selector ?? null,
        text: normalizeWhitespace(finding.text ?? ''),
        kinds: new Map(),
        count: 0,
        severity: 0,
        worstRatio: null,
        required: finding.required ?? null,
        viewports: new Set(),
        foregrounds: new Set(),
        backgrounds: new Set(),
        sourceCandidates: new Map()
      })
    }

    const group = groups.get(key)
    group.count += 1
    group.severity += severity
    group.kinds.set(finding.kind ?? 'unknown', (group.kinds.get(finding.kind ?? 'unknown') ?? 0) + 1)

    if (Number.isFinite(Number(finding.ratio))) {
      group.worstRatio =
        group.worstRatio === null ? Number(finding.ratio) : Math.min(group.worstRatio, Number(finding.ratio))
    }

    if (finding.viewport) {
      group.viewports.add(`${finding.viewport.width}x${finding.viewport.height}`)
    }

    if (finding.foreground) {
      group.foregrounds.add(finding.foreground)
    }

    if (finding.borderColor) {
      group.foregrounds.add(finding.borderColor)
    }

    if (finding.background) {
      group.backgrounds.add(finding.background)
    }

    for (const candidate of candidates) {
      const existing = group.sourceCandidates.get(candidate.file) ?? {
        file: candidate.file,
        family: candidate.family,
        score: 0,
        reasons: new Set()
      }

      existing.score += candidate.score

      for (const reason of candidate.reasons) {
        existing.reasons.add(reason)
      }

      group.sourceCandidates.set(candidate.file, existing)
    }

    const batchKey = topCandidate?.family ?? `route/${finding.route ?? 'unknown'}`
    const batch = batches.get(batchKey) ?? {
      family: batchKey,
      count: 0,
      severity: 0,
      routes: new Set(),
      modes: new Set(),
      files: new Map(),
      selectors: new Map(),
      texts: new Map()
    }

    batch.count += 1
    batch.severity += severity
    batch.routes.add(finding.route ?? 'unknown')
    batch.modes.add(finding.mode ?? 'unknown')
    batch.selectors.set(
      finding.selector ?? 'unknown',
      (batch.selectors.get(finding.selector ?? 'unknown') ?? 0) + 1
    )
    batch.texts.set(
      normalizeWhitespace(finding.text ?? ''),
      (batch.texts.get(normalizeWhitespace(finding.text ?? '')) ?? 0) + 1
    )

    for (const candidate of candidates.slice(0, 3)) {
      batch.files.set(candidate.file, (batch.files.get(candidate.file) ?? 0) + 1)
    }

    batches.set(batchKey, batch)
  }

  return {
    groups: Array.from(groups.values())
      .map(group => ({
        ...group,
        severity: Number(group.severity.toFixed(2)),
        kinds: Object.fromEntries(group.kinds),
        viewports: Array.from(group.viewports).sort(),
        foregrounds: Array.from(group.foregrounds).slice(0, 6),
        backgrounds: Array.from(group.backgrounds).slice(0, 6),
        sourceCandidates: Array.from(group.sourceCandidates.values())
          .map(candidate => ({
            ...candidate,
            reasons: Array.from(candidate.reasons).slice(0, 8)
          }))
          .sort((left, right) => right.score - left.score || left.file.localeCompare(right.file))
          .slice(0, MAX_SOURCE_FILES_PER_FINDING)
      }))
      .sort((left, right) => right.count - left.count || right.severity - left.severity),
    batches: Array.from(batches.values())
      .map(batch => ({
        family: batch.family,
        count: batch.count,
        severity: Number(batch.severity.toFixed(2)),
        routes: Array.from(batch.routes).sort(),
        modes: Array.from(batch.modes).sort(),
        likelyFiles: Array.from(batch.files.entries())
          .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
          .slice(0, 8)
          .map(([file, count]) => ({ file, count })),
        topSelectors: Array.from(batch.selectors.entries())
          .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
          .slice(0, 6)
          .map(([selector, count]) => ({ selector, count })),
        topTexts: Array.from(batch.texts.entries())
          .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
          .slice(0, 6)
          .map(([text, count]) => ({ text, count }))
      }))
      .sort((left, right) => right.count - left.count || right.severity - left.severity)
  }
}

function markdownTable(rows, columns) {
  const header = `| ${columns.map(column => column.label).join(' | ')} |`
  const separator = `| ${columns.map(() => '---').join(' | ')} |`
  const body = rows.map((row, index) => {
    const cells = columns.map(column =>
      String(column.value(row, index) ?? '')
        .replace(/\|/g, '\\|')
        .replace(/\n/g, '<br>')
    )

    return `| ${cells.join(' | ')} |`
  })

  return [header, separator, ...body].join('\n')
}

function buildMarkdown(result) {
  const lines = [
    '# Runtime Contrast Grouping Report',
    '',
    `Status: ${result.status}`,
    `Generated: ${result.generatedAt}`,
    `Input: ${result.inputPath}`,
    '',
    '## Summary',
    '',
    `- Runtime report ok: ${String(result.runtimeReport.ok)}`,
    `- Reported failures: ${result.runtimeReport.reportedFailures}`,
    `- Loaded failures: ${result.runtimeReport.loadedFailures}`,
    `- Warnings: ${result.runtimeReport.warnings}`,
    `- Source files indexed: ${result.sourceIndex.files}`,
    `- Groups: ${result.groups.length}`,
    `- Batch families: ${result.recommendedBatchOrder.length}`
  ]

  if (result.concerns.length > 0) {
    lines.push('', '## Concerns', '')

    for (const concern of result.concerns) {
      lines.push(`- ${concern}`)
    }
  }

  lines.push('', '## Top Groups', '')
  lines.push(
    markdownTable(result.groups.slice(0, MAX_TOP_GROUPS), [
      { label: 'Count', value: row => row.count },
      { label: 'Route', value: row => row.route },
      { label: 'Mode', value: row => row.mode },
      { label: 'Selector', value: row => `\`${row.selector}\`` },
      { label: 'Text', value: row => row.text },
      { label: 'Worst', value: row => row.worstRatio },
      {
        label: 'Likely Source',
        value: row =>
          row.sourceCandidates
            .slice(0, 3)
            .map(candidate => `${candidate.file} (${candidate.reasons.join(', ')})`)
            .join('<br>')
      }
    ])
  )

  lines.push('', '## Recommended Batch Order', '')
  lines.push(
    markdownTable(result.recommendedBatchOrder.slice(0, MAX_BATCHES), [
      { label: '#', value: (_row, index) => index + 1 },
      { label: 'Family', value: row => row.family },
      { label: 'Findings', value: row => row.count },
      { label: 'Severity', value: row => row.severity },
      { label: 'Routes', value: row => row.routes.join(', ') },
      { label: 'Modes', value: row => row.modes.join(', ') },
      {
        label: 'Likely Files',
        value: row => row.likelyFiles.map(file => `${file.file} (${file.count})`).join('<br>')
      },
      {
        label: 'Why First',
        value: row =>
          `Fixing this family can address ${row.count} loaded findings across ${row.routes.length} route(s).`
      }
    ])
  )

  lines.push(
    '',
    '## Notes',
    '',
    '- Source pointers are probabilistic. They are based on exact runtime text, selector/data attributes/classes, and route ownership.',
    '- Batch order optimizes for loaded finding count first, then aggregate contrast deficit.',
    '- Re-run the runtime audit after each batch; the source report can be truncated by the capture script.'
  )

  return `${lines.join('\n')}\n`
}

async function writeContextReport(status, inputPath, jsonOutputPath, markdownOutputPath, concerns) {
  const result = {
    status,
    generatedAt: new Date().toISOString(),
    inputPath,
    changedFiles: [jsonOutputPath, markdownOutputPath],
    concerns,
    runtimeReport: {
      ok: null,
      reportedFailures: null,
      loadedFailures: 0,
      warnings: null
    },
    sourceIndex: {
      files: 0
    },
    groups: [],
    recommendedBatchOrder: []
  }

  await writeFile(path.join(repoRoot, jsonOutputPath), `${JSON.stringify(result, null, 2)}\n`)
  await writeFile(path.join(repoRoot, markdownOutputPath), buildMarkdown(result))

  return result
}

async function main() {
  const inputPath = argValue('--input', DEFAULT_INPUT)
  const jsonOutputPath = argValue('--json-output', DEFAULT_JSON_OUTPUT)
  const markdownOutputPath = argValue('--markdown-output', DEFAULT_MARKDOWN_OUTPUT)
  const absoluteInputPath = path.join(repoRoot, inputPath)

  if (!(await pathExists(absoluteInputPath))) {
    const result = await writeContextReport('NEEDS_CONTEXT', inputPath, jsonOutputPath, markdownOutputPath, [
      `${inputPath} does not exist. Run scripts/theme/audit-runtime-contrast.mjs first.`
    ])

    console.log(JSON.stringify(result, null, 2))
    process.exit(2)
  }

  let report

  try {
    report = JSON.parse(await readFile(absoluteInputPath, 'utf8'))
  } catch (error) {
    const result = await writeContextReport('NEEDS_CONTEXT', inputPath, jsonOutputPath, markdownOutputPath, [
      `${inputPath} could not be parsed as JSON: ${error instanceof Error ? error.message : String(error)}`
    ])

    console.log(JSON.stringify(result, null, 2))
    process.exit(2)
  }

  const failures = Array.isArray(report.failures) ? report.failures : null
  const concerns = []

  if (!failures) {
    const result = await writeContextReport('NEEDS_CONTEXT', inputPath, jsonOutputPath, markdownOutputPath, [
      `${inputPath} has no failures array. Expected output from scripts/theme/audit-runtime-contrast.mjs.`
    ])

    console.log(JSON.stringify(result, null, 2))
    process.exit(2)
  }

  const reportedFailures = Number(report.summary?.failures ?? failures.length)

  if (Number.isFinite(reportedFailures) && reportedFailures > failures.length) {
    concerns.push(
      `Runtime report is truncated: summary reports ${reportedFailures} failures, but only ${failures.length} loaded failures are present.`
    )
  }

  if (failures.some(finding => !finding.route || !finding.mode || !finding.selector)) {
    concerns.push('Some loaded findings are missing route, mode, or selector fields; grouping confidence is reduced.')
  }

  const sourceFiles = await loadSourceIndex()
  const { groups, batches } = buildGroups(failures, sourceFiles)

  const groupsWithoutSource = groups.filter(group => group.sourceCandidates.length === 0).length

  if (groupsWithoutSource > 0) {
    concerns.push(`${groupsWithoutSource} grouped findings have no source candidate from text, selector, or route ownership.`)
  }

  const result = {
    status: createStatus(report, failures, concerns),
    generatedAt: new Date().toISOString(),
    inputPath,
    changedFiles: [jsonOutputPath, markdownOutputPath],
    concerns,
    runtimeReport: {
      ok: Boolean(report.ok),
      baseUrl: report.baseUrl ?? null,
      routes: report.routes ?? [],
      modes: report.modes ?? [],
      viewports: report.viewports ?? [],
      reportedFailures: Number.isFinite(reportedFailures) ? reportedFailures : failures.length,
      loadedFailures: failures.length,
      warnings: Number(report.summary?.warnings ?? report.warnings?.length ?? 0)
    },
    sourceIndex: {
      files: sourceFiles.length,
      roots: SOURCE_ROOTS
    },
    groups,
    recommendedBatchOrder: batches
  }

  await writeFile(path.join(repoRoot, jsonOutputPath), `${JSON.stringify(result, null, 2)}\n`)
  await writeFile(path.join(repoRoot, markdownOutputPath), buildMarkdown(result))

  console.log(
    JSON.stringify(
      {
        status: result.status,
        changedFiles: result.changedFiles,
        concerns: result.concerns,
        topGroups: result.groups.slice(0, 8).map(group => ({
          count: group.count,
          route: group.route,
          mode: group.mode,
          selector: group.selector,
          text: group.text,
          likelySource: group.sourceCandidates[0]?.file ?? null
        })),
        recommendedBatchOrder: result.recommendedBatchOrder.slice(0, 8).map(batch => ({
          family: batch.family,
          count: batch.count,
          routes: batch.routes,
          modes: batch.modes,
          likelyFiles: batch.likelyFiles.slice(0, 3)
        }))
      },
      null,
      2
    )
  )
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
