import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import {
  facebookLoginCompleteResponseSchema,
  facebookLoginStatusResponseSchema
} from './facebookLoginClientResponseSchema'

const classicStatusSchema = z.strictObject({
  connected: z.boolean().optional(),
  linked: z.boolean().optional(),
  needs_contact: z.boolean().optional()
})

const classicCompleteSchema = z.strictObject({
  status: z.enum(['connected', 'needs_contact'])
})

const statusValues = [
  undefined,
  true,
  false,
  null,
  'true',
  1,
  0,
  {},
  []
]

test('status and complete schemas match classic Zod results', () => {
  const statusInputs: unknown[] = [
    {},
    {
      connected: true,
      linked: false,
      needs_contact: true
    },
    { extra: true }
  ]
  for (const key of [
    'connected',
    'linked',
    'needs_contact'
  ] as const) {
    for (const value of statusValues) {
      statusInputs.push({ [key]: value })
    }
  }

  for (const input of statusInputs) {
    assertSameParse(
      classicStatusSchema.safeParse(input),
      facebookLoginStatusResponseSchema.safeParse(input)
    )
  }

  const completeInputs: unknown[] = [
    { status: 'connected' },
    { status: 'needs_contact' },
    { status: 'error' },
    { status: 'connected', extra: true },
    {},
    null,
    'connected'
  ]
  for (const input of completeInputs) {
    assertSameParse(
      classicCompleteSchema.safeParse(input),
      facebookLoginCompleteResponseSchema.safeParse(input)
    )
  }
})

test('client login components do not import classic Zod', () => {
  const root = resolve(directory, '../../..')
  const entryPoints = [
    resolve(directory, 'FacebookLoginPrompt.tsx'),
    resolve(directory, 'FacebookLoginConnectionControl.tsx')
  ]
  const seen = new Set<string>()

  function visit(filePath: string) {
    if (seen.has(filePath)) return
    seen.add(filePath)
    const source = readFileSync(filePath, 'utf8')
    assert.doesNotMatch(
      source,
      /from\s+['"]zod(?:\/v4)?['"]/u,
      `${filePath} imports classic Zod`
    )

    for (const specifier of valueImportSpecifiers(source)) {
      if (specifier === 'zod' || specifier === 'zod/v4') {
        assert.fail(`${filePath} imports classic Zod`)
      }
      const nextPath = resolveLocalModule(
        root,
        filePath,
        specifier
      )
      if (nextPath) visit(nextPath)
    }
  }

  for (const entryPoint of entryPoints) visit(entryPoint)
  assert.ok(
    seen.has(
      resolve(directory, 'facebookLoginClientResponseSchema.ts')
    )
  )
})

const directory = dirname(fileURLToPath(import.meta.url))

function assertSameParse(
  expected: {
    success: boolean
    data?: unknown
    error?: { issues: unknown }
  },
  actual: {
    success: boolean
    data?: unknown
    error?: { issues: unknown }
  }
) {
  assert.equal(actual.success, expected.success)
  if (actual.success && expected.success) {
    assert.deepEqual(actual.data, expected.data)
    return
  }
  if (!actual.success && !expected.success) {
    assert.deepEqual(
      actual.error?.issues,
      expected.error?.issues
    )
  }
}

function valueImportSpecifiers(source: string) {
  const specifiers: string[] = []
  const pattern =
    /import\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/gu
  for (const match of source.matchAll(pattern)) {
    if (match[1]) continue
    const clause = match[2] ?? ''
    if (
      clause.startsWith('{') &&
      clause
        .slice(1, -1)
        .split(',')
        .every(binding =>
          binding.trim().startsWith('type ') ||
          binding.trim() === ''
        )
    ) {
      continue
    }
    const specifier = match[3]
    if (specifier) specifiers.push(specifier)
  }
  return specifiers
}

function resolveLocalModule(
  root: string,
  fromFile: string,
  specifier: string
) {
  let base: string | undefined
  if (specifier.startsWith('@/')) {
    base = resolve(root, 'src', specifier.slice(2))
  } else if (specifier.startsWith('.')) {
    base = resolve(dirname(fromFile), specifier)
  }
  if (!base) return undefined

  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mts`,
    resolve(base, 'index.ts'),
    resolve(base, 'index.tsx')
  ]
  return candidates.find(candidate => existsSync(candidate))
}
