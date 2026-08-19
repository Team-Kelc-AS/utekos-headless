#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const DEFAULT_ANALYZE_DIR = '.next/diagnostics/analyze'
const DEFAULT_SUMMARY_PATH =
  '.next/diagnostics/bundle-agent-summary.json'

const SOURCE_SCHEMA = z.object({
  path: z.string(),
  parent_source_index: z.number().int().nonnegative().nullable().optional()
})

const CHUNK_PART_SCHEMA = z.object({
  source_index: z.number().int().nonnegative(),
  output_file_index: z.number().int().nonnegative(),
  size: z.number().int().nonnegative(),
  compressed_size: z.number().int().nonnegative()
})

const OUTPUT_FILE_SCHEMA = z.object({
  filename: z.string().min(1)
})

const ANALYZE_DATA_SCHEMA = z.object({
  sources: z.array(SOURCE_SCHEMA),
  chunk_parts: z.array(CHUNK_PART_SCHEMA),
  output_files: z.array(OUTPUT_FILE_SCHEMA)
})

const MODULE_SCHEMA = z.object({
  ident: z.string().min(1),
  path: z.string().min(1)
})

const BINARY_SLICE_SCHEMA = z.object({
  offset: z.number().int().nonnegative(),
  length: z.number().int().nonnegative()
})

const MODULES_DATA_SCHEMA = z.object({
  modules: z.array(MODULE_SCHEMA)
})

const ROUTE_STAT_SCHEMA = z.object({
  route: z.string().min(1),
  firstLoadUncompressedJsBytes: z.number().int().nonnegative()
})

const OPTIONS_SCHEMA = z
  .object({
    analyzeDir: z.string().min(1),
    out: z.string().min(1),
    top: z.number().int().positive()
  })
  .strict()

export function extractFirstJsonObject(buffer) {
  const start = buffer.indexOf(0x7b)
  if (start < 0) {
    throw new Error('No JSON object found in analyzer data file')
  }

  let depth = 0
  let inString = false
  let escape = false

  for (let index = start; index < buffer.length; index += 1) {
    const code = buffer[index]
    if (inString) {
      if (escape) {
        escape = false
        continue
      }
      if (code === 0x5c) {
        escape = true
        continue
      }
      if (code === 0x22) {
        inString = false
      }
      continue
    }
    if (code === 0x22) {
      inString = true
      continue
    }
    if (code === 0x7b) depth += 1
    if (code === 0x7d) {
      depth -= 1
      if (depth === 0) {
        const jsonBytes = buffer.subarray(start, index + 1)
        return {
          value: JSON.parse(jsonBytes.toString('utf8')),
          blob: buffer.subarray(index + 1)
        }
      }
    }
  }

  throw new Error('Unterminated JSON object in analyzer data file')
}

export function parseAdjacencyList(blob, slice, nodeCount) {
  const parsedSlice = BINARY_SLICE_SCHEMA.parse(slice)
  const end = parsedSlice.offset + parsedSlice.length
  if (end > blob.length) {
    throw new Error('Adjacency list slice exceeds analyzer blob length')
  }

  const data = blob.subarray(parsedSlice.offset, end)
  if (data.length % 4 !== 0) {
    throw new Error('Adjacency list is not aligned to 4-byte integers')
  }

  const integers = []
  for (let offset = 0; offset < data.length; offset += 4) {
    integers.push(data.readUInt32BE(offset))
  }

  if (integers[0] !== nodeCount) {
    throw new Error(
      `Adjacency list count ${integers[0]} does not match ${nodeCount} nodes`
    )
  }

  const offsets = integers.slice(1, nodeCount + 1)
  const edges = integers.slice(nodeCount + 1)
  if (offsets.length !== nodeCount) {
    throw new Error('Adjacency list is missing per-node offsets')
  }

  for (let index = 1; index < offsets.length; index += 1) {
    const previous = offsets[index - 1]
    const current = offsets[index]
    if (previous === undefined || current === undefined) {
      throw new Error('Adjacency list offset is missing')
    }
    if (current < previous) {
      throw new Error('Adjacency list offsets are not monotonic')
    }
  }

  const lastOffset = offsets.at(-1)
  if (lastOffset === undefined || lastOffset > edges.length) {
    throw new Error('Adjacency list last offset exceeds edge array')
  }

  return { offsets, edges }
}

export function neighbors(nodeIndex, graph) {
  const start = graph.offsets[nodeIndex]
  const nextOffset = graph.offsets[nodeIndex + 1]
  const end = nextOffset ?? graph.edges.length
  if (start === undefined) return []
  return graph.edges.slice(start, end)
}

export function resolveSourcePath(sources, sourceIndex) {
  const parts = []
  const seen = new Set()
  let index = sourceIndex

  while (
    Number.isInteger(index) &&
    index >= 0 &&
    index < sources.length &&
    !seen.has(index)
  ) {
    seen.add(index)
    const source = sources[index]
    if (!source) break
    if (source.path) parts.push(source.path.replace(/\/+$/, ''))
    index = source.parent_source_index ?? undefined
  }

  return parts.reverse().join('/')
}

export function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`
}

function isClientOutputFile(filename) {
  return (
    filename.startsWith('[client-fs]') ||
    filename.includes('/_next/static/')
  )
}

function isJavaScriptPath(sourcePath) {
  return /\.(m?[jt]sx?|cjs)$/i.test(sourcePath) || /\/index\.js$/i.test(sourcePath)
}

function shortenModuleIdent(ident) {
  if (ident.includes('/src/')) {
    return `src/${ident.split('/src/')[1]?.split(' [')[0] ?? ident}`
  }
  const compiled = ident.split('node_modules/').at(-1)
  return (compiled ?? ident).split(' [')[0]
}

const NODE_CRYPTO_IMPORT = /from\s+['"]node:crypto['"]/

function projectSrcPath(modulePath) {
  const marker = '/src/'
  const index = modulePath.indexOf(marker)
  if (index < 0) return null
  return `src/${modulePath.slice(index + marker.length)}`
}

async function listAppClientNodeCryptoImporters(root, modules) {
  const seen = new Set()
  const importers = []

  for (const moduleRecord of modules) {
    if (!moduleRecord.ident.includes('[app-client]')) continue
    const relativePath = projectSrcPath(moduleRecord.path)
    if (!relativePath) continue
    if (seen.has(relativePath)) continue

    const filePath = path.join(root, relativePath)
    let source
    try {
      source = await readFile(filePath, 'utf8')
    } catch {
      continue
    }
    if (!NODE_CRYPTO_IMPORT.test(source)) continue

    seen.add(relativePath)
    importers.push({
      ident: shortenModuleIdent(moduleRecord.ident),
      path: relativePath
    })
  }

  return importers.toSorted((left, right) =>
    left.path.localeCompare(right.path)
  )
}

function parseArgs(argv) {
  const options = {
    analyzeDir: DEFAULT_ANALYZE_DIR,
    out: DEFAULT_SUMMARY_PATH,
    top: 20
  }

  for (const argument of argv) {
    if (argument.startsWith('--analyze-dir=')) {
      options.analyzeDir = argument.slice('--analyze-dir='.length)
      continue
    }
    if (argument.startsWith('--out=')) {
      options.out = argument.slice('--out='.length)
      continue
    }
    if (argument.startsWith('--top=')) {
      options.top = Number(argument.slice('--top='.length))
      continue
    }
    throw new Error(`Unknown argument: ${argument}`)
  }

  return OPTIONS_SCHEMA.parse(options)
}

export async function summarizeBundleAnalyze(root, options) {
  const analyzeDir = path.resolve(root, options.analyzeDir)
  const analyzeDataPath = path.join(analyzeDir, 'data', 'analyze.data')
  const modulesDataPath = path.join(analyzeDir, 'data', 'modules.data')
  const routeStatsPath = path.join(
    root,
    '.next',
    'diagnostics',
    'route-bundle-stats.json'
  )

  const analyzeBuffer = await readFile(analyzeDataPath)
  const modulesBuffer = await readFile(modulesDataPath)
  const analyzeParsed = ANALYZE_DATA_SCHEMA.parse(
    extractFirstJsonObject(analyzeBuffer).value
  )
  const modulesData = MODULES_DATA_SCHEMA.parse(
    extractFirstJsonObject(modulesBuffer).value
  )

  const clientOutputIndexes = new Set(
    analyzeParsed.output_files.flatMap((file, index) =>
      isClientOutputFile(file.filename) ? [index] : []
    )
  )

  const clientBytesBySource = new Map()
  for (const part of analyzeParsed.chunk_parts) {
    if (!clientOutputIndexes.has(part.output_file_index)) continue
    const current = clientBytesBySource.get(part.source_index) ?? {
      uncompressedBytes: 0,
      compressedBytes: 0
    }
    current.uncompressedBytes += part.size
    current.compressedBytes += part.compressed_size
    clientBytesBySource.set(part.source_index, current)
  }

  const clientModules = [...clientBytesBySource.entries()]
    .map(([sourceIndex, bytes]) => {
      const sourcePath = resolveSourcePath(
        analyzeParsed.sources,
        sourceIndex
      )
      return {
        sourceIndex,
        path: sourcePath,
        uncompressedBytes: bytes.uncompressedBytes,
        compressedBytes: bytes.compressedBytes
      }
    })
    .filter(module => isJavaScriptPath(module.path))
    .toSorted((left, right) => right.compressedBytes - left.compressedBytes)

  const cryptoBrowserify = clientModules.find(module =>
    module.path.includes('crypto-browserify/index.js')
  )

  const clientCryptoImporters = await listAppClientNodeCryptoImporters(
    root,
    modulesData.modules
  )

  const routeStats = await (async () => {
    try {
      const rawRouteStats = JSON.parse(
        await readFile(routeStatsPath, 'utf8')
      )
      return z
        .array(ROUTE_STAT_SCHEMA)
        .parse(rawRouteStats)
        .toSorted(
          (left, right) =>
            right.firstLoadUncompressedJsBytes -
            left.firstLoadUncompressedJsBytes
        )
        .slice(0, options.top)
    } catch {
      return []
    }
  })()

  return {
    generatedAt: new Date().toISOString(),
    analyzeDir: options.analyzeDir,
    access: {
      localAnalyzer: 'http://localhost:4000/',
      localAnalyzerBind: 'IPv6 [::1]:4000 — use localhost, not 127.0.0.1',
      githubDevTunnel: 'unauthenticated 401; GitHub login required'
    },
    clientJavaScript: {
      moduleCount: clientModules.length,
      top: clientModules.slice(0, options.top).map(module => ({
        path: module.path,
        uncompressed: formatBytes(module.uncompressedBytes),
        compressed: formatBytes(module.compressedBytes),
        uncompressedBytes: module.uncompressedBytes,
        compressedBytes: module.compressedBytes
      }))
    },
    cryptoBrowserify: cryptoBrowserify ?
      {
        path: cryptoBrowserify.path,
        uncompressed: formatBytes(cryptoBrowserify.uncompressedBytes),
        compressed: formatBytes(cryptoBrowserify.compressedBytes),
        uncompressedBytes: cryptoBrowserify.uncompressedBytes,
        compressedBytes: cryptoBrowserify.compressedBytes,
        cause:
          'Client modules import createHash from \'node:crypto\'; Turbopack polyfills it with next/dist/compiled/crypto-browserify.',
        appClientImporters: clientCryptoImporters
      }
    : {
        path: null,
        appClientImporters: clientCryptoImporters
      },
    heaviestRoutes: routeStats.map(route => ({
      route: route.route,
      firstLoadUncompressedJs: formatBytes(
        route.firstLoadUncompressedJsBytes
      ),
      firstLoadUncompressedJsBytes: route.firstLoadUncompressedJsBytes
    }))
  }
}

function printSummary(summary) {
  console.log('Bundle analyzer agent summary')
  console.log(`Local UI: ${summary.access.localAnalyzer}`)
  console.log(summary.access.localAnalyzerBind)
  console.log(`Tunnel: ${summary.access.githubDevTunnel}`)
  console.log('')
  if (summary.cryptoBrowserify.path) {
    console.log('crypto-browserify (client)')
    console.log(`  ${summary.cryptoBrowserify.compressed} compressed`)
    console.log(`  ${summary.cryptoBrowserify.uncompressed} uncompressed`)
    console.log(`  ${summary.cryptoBrowserify.cause}`)
    for (const importer of summary.cryptoBrowserify.appClientImporters) {
      console.log(`  importer: ${importer.ident}`)
    }
    console.log('')
  }
  console.log(`Top ${summary.clientJavaScript.top.length} client JS modules`)
  for (const moduleRecord of summary.clientJavaScript.top) {
    console.log(
      `  ${moduleRecord.compressed.padStart(10)}  ${moduleRecord.path}`
    )
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
  const summary = await summarizeBundleAnalyze(root, options)
  const outPath = path.resolve(root, options.out)
  await mkdir(path.dirname(outPath), { recursive: true })
  await writeFile(outPath, `${JSON.stringify(summary, null, 2)}\n`)
  printSummary(summary)
  console.log(`\nWrote ${path.relative(root, outPath)}`)
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  main().catch(error => {
    if (error instanceof z.ZodError) {
      console.error(error.message)
    } else {
      const message = error instanceof Error ? error.message : String(error)
      console.error(message)
    }
    console.error(
      'Run `pnpm analyze:turbopack` first so `.next/diagnostics/analyze` exists.'
    )
    process.exitCode = 1
  })
}
