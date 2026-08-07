import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatHex, parse } from 'culori'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

const SOURCE_CSS_PATH = path.join(repoRoot, 'src/color-2.css')
const OUTPUT_JSON_PATH = path.join(
  repoRoot,
  'src/lib/brand/color-2-scales.json'
)

const SHADE_STEPS = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950'
]

const SEMANTIC_FAMILY_IDS = new Set([
  'accent',
  'background',
  'border',
  'card',
  'card-primary',
  'destructive',
  'foreground',
  'input',
  'muted',
  'popover',
  'primary',
  'ring',
  'secondary'
])

function titleize(value) {
  return value
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizeOklch(value) {
  const trimmed = value.trim()

  if (trimmed.startsWith('oklch(')) {
    return trimmed
  }

  const match = trimmed.match(/^oklch\((.+)\)$/i)
  if (match) {
    return `oklch(${match[1]})`
  }

  return trimmed
}

function resolveCssValue(
  rawValue,
  variables,
  stack = new Set()
) {
  const trimmed = rawValue.trim().replace(/\s+/g, ' ')

  if (!trimmed.startsWith('var(')) {
    return trimmed
  }

  const match = trimmed.match(
    /^var\(\s*(--color-[a-z0-9-]+)\s*(?:,\s*([^)]+))?\s*\)$/i
  )
  if (!match) {
    return trimmed
  }

  const [, cssVar, fallback] = match
  if (stack.has(cssVar)) {
    return fallback?.trim() ?? trimmed
  }

  const referenced = variables.get(cssVar)
  if (!referenced) {
    return fallback?.trim() ?? trimmed
  }

  stack.add(cssVar)
  const resolved = resolveCssValue(referenced, variables, stack)
  stack.delete(cssVar)

  return resolved
}

function toHex(colorValue) {
  const parsed = parse(colorValue)
  if (!parsed) {
    return null
  }

  return formatHex(parsed)
}

function parseColorVariables(css) {
  const variables = new Map()
  const tokenPattern = /--color-([a-z0-9-]+):\s*([^;]+);/gi
  let match = tokenPattern.exec(css)

  while (match) {
    const cssVar = `--color-${match[1]}`
    variables.set(cssVar, match[2].trim())
    match = tokenPattern.exec(css)
  }

  return variables
}

function buildFamilies(variables) {
  const families = new Map()

  for (const [cssVar, rawValue] of variables) {
    const tokenName = cssVar.replace(/^--color-/, '')
    const shadeMatch = tokenName.match(
      /^(.+)-(50|100|200|300|400|500|600|700|800|900|950)$/
    )
    if (!shadeMatch) {
      continue
    }

    const [, familyId, shade] = shadeMatch
    if (SEMANTIC_FAMILY_IDS.has(familyId)) {
      continue
    }

    const resolvedValue = resolveCssValue(rawValue, variables)
    if (resolvedValue.startsWith('var(')) {
      continue
    }

    const oklch = normalizeOklch(resolvedValue)
    const hex = toHex(oklch)
    if (!hex) {
      continue
    }

    if (!families.has(familyId)) {
      families.set(familyId, {
        id: familyId,
        title: titleize(familyId),
        steps: []
      })
    }

    families.get(familyId).steps.push({
      shade,
      cssVar,
      token: `${familyId}-${shade}`,
      oklch,
      hex
    })
  }

  return [...families.values()]
    .map(family => ({
      ...family,
      steps: family.steps.sort(
        (left, right) => Number(left.shade) - Number(right.shade)
      )
    }))
    .filter(family => family.steps.length >= 3)
    .sort((left, right) => left.id.localeCompare(right.id))
}

async function main() {
  const css = await readFile(SOURCE_CSS_PATH, 'utf8')
  const variables = parseColorVariables(css)
  const families = buildFamilies(variables)

  const payload = {
    generatedAt: new Date().toISOString(),
    source: 'src/color-2.css',
    shadeSteps: SHADE_STEPS,
    familyCount: families.length,
    families
  }

  await writeFile(
    OUTPUT_JSON_PATH,
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  )

  console.log(
    `Wrote ${families.length} color families to ${path.relative(repoRoot, OUTPUT_JSON_PATH)}`
  )
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
