#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatHex, parse, wcagContrast } from 'culori'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const sourcePath = path.join(repoRoot, 'src/globals.css')

const TEXT_CONTRAST_THRESHOLD = 4.5
const EXPLICIT_DARK_TOKEN_PREFIX = '--dark-'
const SOURCE_DIRECTORIES = ['src']
const SOURCE_EXTENSIONS = new Set(['.css', '.mdx', '.ts', '.tsx'])
const IGNORED_SOURCE_DIRECTORIES = new Set([
  '.git',
  '.next',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'generated',
  'node_modules',
  '__generated__'
])
const DEFAULT_SOURCE_FILES = [
  'src/components/header/ActiveLink.tsx',
  'src/components/header/DesktopNavigation.tsx',
  'src/components/header/Header.tsx',
  'src/components/header/MobileMenu/MobileMenuClient.tsx',
  'src/components/header/MobileMenu/MobileMenuPanel.tsx',
  'src/components/BrandComponents/SaleBadge.tsx',
  'src/components/BrandComponents/SaveAmountBadge.tsx',
  'src/components/BrandComponents/utils/BrandBadge.tsx',
  'src/components/ProductCard/ProductCardFooter.tsx',
  'src/components/frontpage/HeroSection/MotionContentView.tsx',
  'src/components/frontpage/components/TechDownCampaign/AddNewProductToCartButton.tsx',
  'src/components/frontpage/components/TechDownCampaign/DiscoverProductButton.tsx',
  'src/components/frontpage/components/TechDownCampaign/FeatureCard.tsx',
  'src/components/frontpage/components/TechDownCampaign/NewProductLaunchSectionView.tsx',
  'src/components/ui/button.tsx',
  'src/components/ui/dropdown-menu.tsx'
]
const COLOR_UTILITY_PREFIXES = [
  'accent',
  'bg',
  'border',
  'caret',
  'decoration',
  'divide',
  'fill',
  'from',
  'outline',
  'placeholder',
  'ring',
  'shadow',
  'stroke',
  'text',
  'to',
  'via'
]
const TAILWIND_COLOR_FAMILIES = new Set([
  'amber',
  'blue',
  'cyan',
  'emerald',
  'fuchsia',
  'gray',
  'green',
  'indigo',
  'lime',
  'neutral',
  'orange',
  'pink',
  'purple',
  'red',
  'rose',
  'sky',
  'slate',
  'stone',
  'teal',
  'violet',
  'yellow',
  'zinc'
])
const BUILT_IN_COLOR_NAMES = new Set([
  'black',
  'current',
  'inherit',
  'transparent',
  'white'
])
const NON_COLOR_UTILITY_NAMES = new Set([
  'auto',
  'balance',
  'base',
  'b',
  'b-0',
  'block',
  'bold',
  'bottom',
  'center',
  'clip',
  'collapse',
  'color',
  'conic',
  'current',
  'dashed',
  'dotted',
  'double',
  'end',
  'fit',
  'fixed',
  'flex',
  'fluid-display',
  'fluid-display-bold',
  'full',
  'gradient-to-b',
  'gradient-to-l',
  'gradient-to-r',
  'gradient-to-t',
  'grid',
  'hidden',
  'hiddenfont-bold',
  'inline',
  'inset',
  'l',
  'l-0',
  'left',
  'linear',
  'linear-to-b',
  'linear-to-br',
  'linear-to-l',
  'linear-to-r',
  'linear-to-t',
  'linear-to-tr',
  'lg',
  'l-2',
  'l-4',
  'l-transparent',
  'md',
  'ml',
  'none',
  'nowrap',
  'offset',
  'offset-1',
  'offset-2',
  'offset-4',
  'paragraph',
  'pretty',
  'r',
  'r-0',
  'r-2',
  'radial',
  'radius',
  'relative',
  'responsive-heading-level-two',
  'responsive-title',
  'right',
  'screen',
  'solid',
  'start',
  'sm',
  'table',
  't',
  't-0',
  't-transparent',
  'text',
  'top',
  'transparent',
  'underline-offset',
  'white',
  'wrap',
  'x',
  '2xl',
  'xl',
  'xs',
  'y',
  'y-0'
])
const TEXT_SIZE_NAMES = new Set([
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
  '8xl',
  '9xl',
  'base',
  'lg',
  'sm',
  'xl',
  'xs'
])
const TYPESCRIPT_CLASS_CONTRACT_HINT_PATTERN =
  /\b(?:background|body|border|button|card|class(?:Name|Names)?|ClassName|Classes|colorClasses|container|foreground|heading|iconColor|lead|link|list|muted|mutedText|page|primary|secondary|section|separator|stripe|style|styles|surface|tab|text|tone|trigger|variant)\b/
const TYPESCRIPT_COLOR_UTILITY_PATTERN =
  /\b(?:accent|bg|border|caret|decoration|divide|fill|from|outline|placeholder|ring|shadow|stroke|text|to|via)-[A-Za-z0-9][A-Za-z0-9_-]*(?:\/[A-Za-z0-9.[\]_-]+)?\b/g

const TEXT_PAIRS = [
  ['background', 'foreground'],
  ['card', 'card-foreground'],
  ['popover', 'popover-foreground'],
  ['primary', 'primary-foreground'],
  ['primary-hover', 'primary-foreground'],
  ['secondary', 'secondary-foreground'],
  ['muted', 'muted-foreground'],
  ['accent', 'accent-foreground'],
  ['destructive', 'destructive-foreground'],
  ['promo', 'promo-foreground'],
  ['commerce-primary', 'commerce-primary-foreground'],
  ['commerce-primary-hover', 'commerce-primary-hover-foreground'],
  ['commerce-secondary', 'commerce-secondary-foreground'],
  ['commerce-secondary-hover', 'commerce-secondary-hover-foreground'],
  ['featured', 'featured-foreground'],
  ['sidebar', 'sidebar-foreground'],
  ['sidebar-primary', 'sidebar-primary-foreground'],
  ['sidebar-accent', 'sidebar-accent-foreground']
]

const SEMANTIC_COLOR_TOKEN_NAMES = new Set([
  'background',
  'foreground',
  'card',
  'card-foreground',
  'card-hover',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'primary-hover',
  'primary-active',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
  'promo',
  'promo-foreground',
  'featured',
  'featured-foreground',
  'featured-border',
  'commerce-primary',
  'commerce-primary-foreground',
  'commerce-primary-hover',
  'commerce-primary-hover-foreground',
  'commerce-secondary',
  'commerce-secondary-foreground',
  'commerce-secondary-hover',
  'commerce-secondary-hover-foreground',
  'link',
  'badge',
  'foreground-on-dark',
  'heading-secondary',
  'paragraph',
  'split',
  'docs'
])

const UNSAFE_CLASS_COMBINATIONS = [
  {
    background: 'bg-card',
    foreground: 'text-coral-green',
    expected: 'bg-promo text-promo-foreground'
  },
  {
    background: 'bg-secondary',
    foreground: 'text-foreground',
    expected: 'bg-secondary text-secondary-foreground'
  },
  {
    background: 'bg-accent',
    foreground: 'text-background',
    expected: 'bg-accent text-accent-foreground'
  },
  {
    background: 'bg-accent',
    foreground: 'text-foreground',
    expected: 'bg-accent text-accent-foreground'
  }
]

const UNSAFE_BRAND_BADGE_COLOR_PROPS = [
  {
    background: 'backgroundColor=\'var(--secondary)\'',
    foreground: 'textColor=\'var(--foreground)\'',
    expected: 'tone=\'commerce-secondary\''
  },
  {
    background: 'backgroundColor=\'var(--accent)\'',
    foreground: 'textColor=\'var(--background)\'',
    expected: 'tone=\'commerce-primary\''
  },
  {
    background: 'backgroundColor=\'var(--color-accent)\'',
    foreground: 'textColor=\'var(--color-background)\'',
    expected: 'tone=\'commerce-primary\''
  }
]

function lineNumberAt(css, index) {
  let line = 1

  for (let cursor = 0; cursor < index; cursor += 1) {
    if (css[cursor] === '\n') {
      line += 1
    }
  }

  return line
}

function normalizeWhitespace(value) {
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeBlockLabel(value) {
  const withoutComments = value.replace(/\/\*[\s\S]*?\*\//g, ' ')
  const segments = withoutComments.split(';')

  return normalizeWhitespace(segments.at(-1) ?? withoutComments)
}

async function readCssWithLocalImports(file, seen = new Set()) {
  const resolvedFile = path.resolve(file)

  if (seen.has(resolvedFile)) {
    return ''
  }

  seen.add(resolvedFile)

  const css = await readFile(resolvedFile, 'utf8')
  const importPattern = /@import\s+['"]([^'"]+)['"];/g
  let compiled = ''
  let lastIndex = 0
  let match = importPattern.exec(css)

  while (match) {
    compiled += css.slice(lastIndex, match.index)

    const importPath = match[1]

    if (!importPath.startsWith('.')) {
      compiled += match[0]
      lastIndex = importPattern.lastIndex
      match = importPattern.exec(css)
      continue
    }

    const resolvedImport = path.resolve(path.dirname(resolvedFile), importPath)
    const importFile = path.extname(resolvedImport)
      ? resolvedImport
      : `${resolvedImport}.css`

    compiled += `\n/* ${path.relative(repoRoot, importFile)} */\n`
    compiled += await readCssWithLocalImports(importFile, seen)
    compiled += '\n'
    lastIndex = importPattern.lastIndex
    match = importPattern.exec(css)
  }

  compiled += css.slice(lastIndex)

  return compiled
}

function findMatchingBrace(css, openingBraceIndex) {
  let depth = 0

  for (let index = openingBraceIndex; index < css.length; index += 1) {
    if (css[index] === '{') {
      depth += 1
      continue
    }

    if (css[index] !== '}') {
      continue
    }

    depth -= 1
    if (depth === 0) {
      return index
    }
  }

  return -1
}

function findTokenBlocks(css) {
  const blocks = []
  const blockPattern = /([^{}]+)\s*\{/g
  let match = blockPattern.exec(css)

  while (match) {
    const label = normalizeBlockLabel(match[1])
    const openingBraceIndex = blockPattern.lastIndex - 1
    const closingBraceIndex = findMatchingBrace(css, openingBraceIndex)

    if (closingBraceIndex === -1) {
      throw new Error(`Unclosed ${label} block at line ${lineNumberAt(css, match.index)}`)
    }

    blocks.push({
      label,
      line: lineNumberAt(css, match.index),
      bodyStart: openingBraceIndex + 1,
      bodyEnd: closingBraceIndex,
      body: css.slice(openingBraceIndex + 1, closingBraceIndex)
    })

    blockPattern.lastIndex = closingBraceIndex + 1
    match = blockPattern.exec(css)
  }

  return blocks
}

function extractDeclarations(css, block) {
  const declarations = []
  const declarationPattern = /(--[a-zA-Z0-9-_]+)\s*:\s*([\s\S]*?);/g
  let match = declarationPattern.exec(block.body)

  while (match) {
    declarations.push({
      block: block.label,
      name: match[1],
      value: normalizeWhitespace(match[2]),
      line: lineNumberAt(css, block.bodyStart + match.index)
    })
    match = declarationPattern.exec(block.body)
  }

  return declarations
}

function buildContext(declarations) {
  const context = new Map()

  for (const declaration of declarations) {
    context.set(declaration.name, declaration)
  }

  return context
}

function buildDarkTokenAliases(declarations) {
  return declarations
    .filter(declaration =>
      declaration.name.startsWith(EXPLICIT_DARK_TOKEN_PREFIX)
    )
    .map(declaration => ({
      ...declaration,
      name: `--${declaration.name.slice(EXPLICIT_DARK_TOKEN_PREFIX.length)}`,
      sourceName: declaration.name
    }))
}

function buildExplicitDarkContext(themeDeclarations, rootDeclarations) {
  return buildContext([
    ...themeDeclarations,
    ...rootDeclarations,
    ...buildDarkTokenAliases(rootDeclarations)
  ])
}

function unprefixedCustomPropertyName(name) {
  return name.startsWith('--') ? name.slice(2) : name
}

function auditForbiddenDarkSemanticDeclarations(declarations) {
  return declarations
    .filter(declaration => {
      if (declaration.block !== '.dark') {
        return false
      }

      const name = unprefixedCustomPropertyName(declaration.name)

      return (
        SEMANTIC_COLOR_TOKEN_NAMES.has(name) ||
        declaration.name.startsWith(EXPLICIT_DARK_TOKEN_PREFIX)
      )
    })
    .map(declaration => ({
      file: path.relative(repoRoot, sourcePath),
      line: declaration.line,
      declaration: declaration.name,
      expected:
        'Define dark semantic values as :root --dark-* tokens and use explicit dark:* utilities.'
    }))
}

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      if (IGNORED_SOURCE_DIRECTORIES.has(entry.name)) {
        continue
      }

      files.push(...(await listSourceFiles(entryPath)))
      continue
    }

    if (!entry.isFile()) {
      continue
    }

    if (entryPath === sourcePath) {
      continue
    }

    if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(entryPath)
    }
  }

  return files
}

function buildThemeColorNames(declarations) {
  return new Set(
    declarations
      .filter(declaration => declaration.name.startsWith('--color-'))
      .map(declaration => declaration.name.slice('--color-'.length))
  )
}

function isAuditedSemanticColorName(colorName) {
  if (SEMANTIC_COLOR_TOKEN_NAMES.has(colorName)) {
    return true
  }

  if (!colorName.startsWith('dark-')) {
    return false
  }

  return SEMANTIC_COLOR_TOKEN_NAMES.has(colorName.slice('dark-'.length))
}

function isAuditedColorDeclaration(declaration) {
  const name = unprefixedCustomPropertyName(declaration.name)

  if (isAuditedSemanticColorName(name)) {
    return true
  }

  if (!name.startsWith('color-')) {
    return false
  }

  return isAuditedSemanticColorName(name.slice('color-'.length))
}

function isInlineThemeSelfBridge(declaration) {
  return (
    declaration.block.startsWith('@theme') &&
    declaration.name.startsWith('--color-') &&
    normalizeWhitespace(declaration.value) === `var(${declaration.name})`
  )
}

function isBuiltInColorName(name) {
  if (BUILT_IN_COLOR_NAMES.has(name)) {
    return true
  }

  const [family, shade] = name.split('-')

  return (
    TAILWIND_COLOR_FAMILIES.has(family) &&
    /^\d{2,3}$/.test(shade ?? '')
  )
}

function normalizeClassToken(rawToken) {
  const token = rawToken
    .trim()
    .replace(/^[^a-zA-Z![]+/, '')
    .replace(/[,);]+$/, '')
    .replace(/!$/, '')

  if (!token || token.startsWith('[') || token.includes('[')) {
    return null
  }

  return token.split(':').at(-1)?.replace(/^!/, '') ?? null
}

function classUtilityAndVariant(rawToken) {
  const token = rawToken
    .trim()
    .replace(/^[^a-zA-Z![]+/, '')
    .replace(/[,);]+$/, '')
    .replace(/!$/, '')

  if (!token || token.startsWith('[') || token.includes('[')) {
    return null
  }

  const parts = token.split(':')
  const utility = parts.at(-1)?.replace(/^!/, '')

  if (!utility) {
    return null
  }

  return {
    utility,
    variant: parts.slice(0, -1).join(':')
  }
}

function colorNameFromClassToken(rawToken) {
  const token = normalizeClassToken(rawToken)

  if (!token) {
    return null
  }

  if (token.startsWith('ring-offset-')) {
    const colorName = token.slice('ring-offset-'.length).split('/')[0]

    return /^\d/.test(colorName) ? null : colorName
  }

  if (token.startsWith('outline-offset-')) {
    return null
  }

  for (const prefix of COLOR_UTILITY_PREFIXES) {
    const marker = `${prefix}-`

    if (!token.startsWith(marker)) {
      continue
    }

    const colorName = token.slice(marker.length).split('/')[0]

    if (
      !colorName ||
      colorName.startsWith('[') ||
      colorName.includes('(') ||
      colorName.includes('$') ||
      colorName.includes('=') ||
      /^\d/.test(colorName)
    ) {
      return null
    }

    if (prefix === 'text' && TEXT_SIZE_NAMES.has(colorName)) {
      return null
    }

    if (prefix === 'bg' && colorName === 'clip-text') {
      return null
    }

    if (prefix === 'bg' && colorName === 'clip-padding') {
      return null
    }

    if (prefix === 'shadow' && NON_COLOR_UTILITY_NAMES.has(colorName)) {
      return null
    }

    return colorName
  }

  return null
}

function lineNumberForText(text, index) {
  return lineNumberAt(text, index)
}

function sourceForUtilityAudit(file, source) {
  if (path.extname(file) !== '.ts') {
    return source
  }

  const lines = source.split('\n')

  return lines
    .map((line, index) => {
      const previousLine = lines[index - 1] ?? ''
      const utilityMatches = line.match(TYPESCRIPT_COLOR_UTILITY_PATTERN) ?? []

      if (
        TYPESCRIPT_CLASS_CONTRACT_HINT_PATTERN.test(line) ||
        TYPESCRIPT_CLASS_CONTRACT_HINT_PATTERN.test(previousLine) ||
        utilityMatches.length > 1
      ) {
        return line
      }

      return ''
    })
    .join('\n')
}

async function sourceFilesForUtilityAudit() {
  if (process.argv.includes('--all-source')) {
    return (
      await Promise.all(
        SOURCE_DIRECTORIES.map(directory =>
          listSourceFiles(path.join(repoRoot, directory))
        )
      )
    ).flat()
  }

  return DEFAULT_SOURCE_FILES.map(file => path.join(repoRoot, file))
}

async function auditUsedColorUtilities(themeColorNames) {
  const files = await sourceFilesForUtilityAudit()
  const undefinedColorUtilities = []
  const tokenPattern = /[^\s"'`<>]+/g

  for (const file of files) {
    const source = sourceForUtilityAudit(file, await readFile(file, 'utf8'))
    let match = tokenPattern.exec(source)

    while (match) {
      const colorName = colorNameFromClassToken(match[0])

      if (
        colorName &&
        isAuditedSemanticColorName(colorName) &&
        !themeColorNames.has(colorName) &&
        !isBuiltInColorName(colorName) &&
        !NON_COLOR_UTILITY_NAMES.has(colorName)
      ) {
        undefinedColorUtilities.push({
          file: path.relative(repoRoot, file),
          line: lineNumberForText(source, match.index),
          classToken: match[0],
          colorName,
          expectedToken: `--color-${colorName}`
        })
      }

      match = tokenPattern.exec(source)
    }
  }

  return dedupeIssues(undefinedColorUtilities).sort((a, b) => {
    if (a.file !== b.file) {
      return a.file.localeCompare(b.file)
    }

    return a.line - b.line
  })
}

function hasUnsafeClassCombination(line, backgroundToken, foregroundToken) {
  const rawTokens = line.match(/[^\s"'`<>]+/g) ?? []
  const backgroundVariants = new Set()
  const foregroundVariants = new Set()

  for (const rawToken of rawTokens) {
    const parsed = classUtilityAndVariant(rawToken)

    if (!parsed) {
      continue
    }

    if (parsed.utility === backgroundToken) {
      backgroundVariants.add(parsed.variant)
    }

    if (parsed.utility === foregroundToken) {
      foregroundVariants.add(parsed.variant)
    }
  }

  return Array.from(backgroundVariants).some(variant =>
    foregroundVariants.has(variant)
  )
}

async function auditUnsafeColorContracts() {
  const files = await sourceFilesForUtilityAudit()
  const unsafeColorContracts = []

  for (const file of files) {
    const source = await readFile(file, 'utf8')
    const lines = source.split('\n')

    lines.forEach((line, index) => {
      for (const contract of UNSAFE_CLASS_COMBINATIONS) {
        if (
          hasUnsafeClassCombination(
            line,
            contract.background,
            contract.foreground
          )
        ) {
          unsafeColorContracts.push({
            file: path.relative(repoRoot, file),
            line: index + 1,
            background: contract.background,
            foreground: contract.foreground,
            expected: contract.expected
          })
        }
      }
    })

    for (const contract of UNSAFE_BRAND_BADGE_COLOR_PROPS) {
      const backgroundIndex = source.indexOf(contract.background)
      const foregroundIndex = source.indexOf(contract.foreground)

      if (backgroundIndex === -1 || foregroundIndex === -1) {
        continue
      }

      if (Math.abs(backgroundIndex - foregroundIndex) > 320) {
        continue
      }

      unsafeColorContracts.push({
        file: path.relative(repoRoot, file),
        line: lineNumberForText(
          source,
          Math.min(backgroundIndex, foregroundIndex)
        ),
        background: contract.background,
        foreground: contract.foreground,
        expected: contract.expected
      })
    }
  }

  return dedupeIssues(unsafeColorContracts).sort((a, b) => {
    if (a.file !== b.file) {
      return a.file.localeCompare(b.file)
    }

    return a.line - b.line
  })
}

function findTopLevelComma(value) {
  let depth = 0

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]

    if (character === '(') {
      depth += 1
      continue
    }

    if (character === ')') {
      depth -= 1
      continue
    }

    if (character === ',' && depth === 0) {
      return index
    }
  }

  return -1
}

function parseVarContent(content) {
  const commaIndex = findTopLevelComma(content)
  const rawName =
    commaIndex === -1 ? content.trim() : content.slice(0, commaIndex).trim()
  const fallback =
    commaIndex === -1 ? null : content.slice(commaIndex + 1).trim()

  if (!/^--[a-zA-Z0-9-_]+$/.test(rawName)) {
    return null
  }

  return {
    name: rawName,
    fallback
  }
}

function findVarCalls(value) {
  const calls = []
  let index = 0

  while (index < value.length) {
    const start = value.indexOf('var(', index)

    if (start === -1) {
      break
    }

    let depth = 1
    let cursor = start + 4

    while (cursor < value.length && depth > 0) {
      if (value[cursor] === '(') {
        depth += 1
      } else if (value[cursor] === ')') {
        depth -= 1
      }
      cursor += 1
    }

    if (depth !== 0) {
      break
    }

    const content = value.slice(start + 4, cursor - 1)
    const parsed = parseVarContent(content)

    if (parsed) {
      calls.push({
        start,
        end: cursor,
        source: value.slice(start, cursor),
        ...parsed
      })
    }

    index = cursor
  }

  return calls
}

function extractAllCustomPropertyNames(css) {
  const names = new Set()
  const declarationPattern = /(--[a-zA-Z0-9-_]+)\s*:/g
  let match = declarationPattern.exec(css)

  while (match) {
    names.add(match[1])
    match = declarationPattern.exec(css)
  }

  return names
}

function auditCssVarReferences(css, declaredPropertyNames) {
  const undefinedCssVarReferences = []
  const calls = findVarCalls(css)

  for (const call of calls) {
    if (declaredPropertyNames.has(call.name) || call.fallback) {
      continue
    }

    undefinedCssVarReferences.push({
      file: path.relative(repoRoot, sourcePath),
      line: lineNumberAt(css, call.start),
      reference: call.name
    })
  }

  return dedupeIssues(undefinedCssVarReferences).sort(
    (first, second) => first.line - second.line
  )
}

function resolveValue(rawValue, context, stack = []) {
  const calls = findVarCalls(rawValue)

  if (calls.length === 0) {
    return {
      value: normalizeWhitespace(rawValue),
      undefinedReferences: [],
      circularReferences: []
    }
  }

  let resolved = ''
  let lastIndex = 0
  const undefinedReferences = []
  const circularReferences = []

  for (const call of calls) {
    resolved += rawValue.slice(lastIndex, call.start)

    if (stack.includes(call.name)) {
      circularReferences.push({
        reference: call.name,
        chain: [...stack, call.name]
      })
      resolved += call.source
      lastIndex = call.end
      continue
    }

    const referenced = context.get(call.name)

    if (!referenced) {
      if (call.fallback) {
        const fallback = resolveValue(call.fallback, context, stack)
        resolved += fallback.value
        undefinedReferences.push(...fallback.undefinedReferences)
        circularReferences.push(...fallback.circularReferences)
      } else {
        undefinedReferences.push({
          reference: call.name,
          chain: [...stack, call.name]
        })
        resolved += call.source
      }
      lastIndex = call.end
      continue
    }

    const nested = resolveValue(referenced.value, context, [
      ...stack,
      call.name
    ])
    resolved += nested.value
    undefinedReferences.push(...nested.undefinedReferences)
    circularReferences.push(...nested.circularReferences)
    lastIndex = call.end
  }

  resolved += rawValue.slice(lastIndex)

  return {
    value: normalizeWhitespace(resolved),
    undefinedReferences,
    circularReferences
  }
}

function collectReferenceIssues(declaration, scope, context) {
  if (findVarCalls(declaration.value).length === 0) {
    return {
      undefinedReferences: [],
      circularReferences: []
    }
  }

  const resolved = resolveValue(declaration.value, context, [declaration.name])

  return {
    undefinedReferences: resolved.undefinedReferences.map(issue => ({
      scope,
      declaration: declaration.name,
      line: declaration.line,
      reference: issue.reference,
      chain: issue.chain
    })),
    circularReferences: resolved.circularReferences.map(issue => ({
      scope,
      declaration: declaration.name,
      line: declaration.line,
      reference: issue.reference,
      chain: issue.chain
    }))
  }
}

function tokenName(name) {
  return `--${name}`
}

function resolveColorToken(scope, context, token) {
  const declaration = context.get(token)

  if (!declaration) {
    return {
      ok: false,
      error: {
        scope,
        token,
        reason: 'missing-token'
      }
    }
  }

  const resolved = resolveValue(declaration.value, context, [token])

  if (resolved.undefinedReferences.length > 0) {
    return {
      ok: false,
      error: {
        scope,
        token,
        line: declaration.line,
        reason: 'undefined-reference',
        references: resolved.undefinedReferences.map(issue => issue.reference)
      }
    }
  }

  if (resolved.circularReferences.length > 0) {
    return {
      ok: false,
      error: {
        scope,
        token,
        line: declaration.line,
        reason: 'circular-reference',
        references: resolved.circularReferences.map(issue => issue.reference)
      }
    }
  }

  const color = parse(resolved.value)

  if (!color) {
    return {
      ok: false,
      error: {
        scope,
        token,
        line: declaration.line,
        reason: 'invalid-color',
        value: resolved.value
      }
    }
  }

  return {
    ok: true,
    value: resolved.value,
    hex: formatHex(color),
    color
  }
}

function auditContrast(scope, context) {
  const failures = []
  const skipped = []
  let checked = 0

  for (const [backgroundName, foregroundName] of TEXT_PAIRS) {
    const backgroundToken = tokenName(backgroundName)
    const foregroundToken = tokenName(foregroundName)
    const background = resolveColorToken(scope, context, backgroundToken)
    const foreground = resolveColorToken(scope, context, foregroundToken)

    if (!background.ok || !foreground.ok) {
      skipped.push({
        scope,
        pair: `${backgroundName}/${foregroundName}`,
        reason: 'unresolved-token',
        errors: [background.error, foreground.error].filter(Boolean)
      })
      continue
    }

    checked += 1
    const ratio = wcagContrast(foreground.color, background.color)

    if (ratio < TEXT_CONTRAST_THRESHOLD) {
      failures.push({
        scope,
        pair: `${backgroundName}/${foregroundName}`,
        ratio: Number(ratio.toFixed(2)),
        required: TEXT_CONTRAST_THRESHOLD,
        background: {
          token: backgroundToken,
          value: background.value,
          hex: background.hex
        },
        foreground: {
          token: foregroundToken,
          value: foreground.value,
          hex: foreground.hex
        }
      })
    }
  }

  return {
    checked,
    failures,
    skipped
  }
}

function dedupeIssues(issues) {
  const seen = new Set()
  const deduped = []

  for (const issue of issues) {
    const key = JSON.stringify(issue)

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(issue)
  }

  return deduped
}

async function main() {
  const css = await readCssWithLocalImports(sourcePath)
  const blocks = findTokenBlocks(css)
  const declarations = blocks.flatMap(block => extractDeclarations(css, block))
  const themeDeclarations = declarations.filter(declaration =>
    declaration.block.startsWith('@theme')
  )
  const themeColorNames = buildThemeColorNames(themeDeclarations)
  const baseDeclarations = declarations.filter(
    declaration => declaration.block !== '.dark'
  )
  const semanticRootDeclarations = declarations.filter(
    declaration =>
      declaration.block === ':root' &&
      (SEMANTIC_COLOR_TOKEN_NAMES.has(
        unprefixedCustomPropertyName(declaration.name)
      ) ||
        declaration.name.startsWith(EXPLICIT_DARK_TOKEN_PREFIX))
  )
  const darkDeclarations = declarations.filter(
    declaration => declaration.block === '.dark'
  )
  const rootContext = buildContext(baseDeclarations)
  const darkContext = buildExplicitDarkContext(
    themeDeclarations,
    baseDeclarations
  )
  const scopedContexts = [
    {
      scope: ':root',
      context: rootContext
    },
    {
      scope: 'dark:*',
      context: darkContext
    }
  ]

  const undefinedReferences = []
  const circularReferences = []
  const forbiddenDarkSemanticDeclarations =
    auditForbiddenDarkSemanticDeclarations(darkDeclarations)

  for (const declaration of declarations) {
    if (
      !isAuditedColorDeclaration(declaration) ||
      isInlineThemeSelfBridge(declaration)
    ) {
      continue
    }

    const scopes = declaration.block.startsWith('@theme')
      ? scopedContexts
      : scopedContexts.filter(entry => {
          if (!declaration.block.startsWith('@theme')) {
            return entry.scope === ':root'
          }

          return entry.scope === declaration.block
        })

    for (const { scope, context } of scopes) {
      const issues = collectReferenceIssues(declaration, scope, context)
      undefinedReferences.push(...issues.undefinedReferences)
      circularReferences.push(...issues.circularReferences)
    }
  }

  const rootContrast = auditContrast(':root', rootContext)
  const darkContrast = auditContrast('dark:*', darkContext)
  const contrastFailures = [
    ...rootContrast.failures,
    ...darkContrast.failures
  ]
  const contrastSkipped = [...rootContrast.skipped, ...darkContrast.skipped]
  const undefinedColorUtilities =
    await auditUsedColorUtilities(themeColorNames)
  const unsafeColorContracts = await auditUnsafeColorContracts()
  const auditedReferenceCss = declarations
    .filter(
      declaration =>
        isAuditedColorDeclaration(declaration) &&
        !isInlineThemeSelfBridge(declaration)
    )
    .map(declaration => `${declaration.name}: ${declaration.value};`)
    .join('\n')
  const undefinedCssVarReferences = auditCssVarReferences(
    auditedReferenceCss,
    extractAllCustomPropertyNames(css)
  )
  const ok =
    undefinedReferences.length === 0 &&
    circularReferences.length === 0 &&
    contrastFailures.length === 0 &&
    contrastSkipped.length === 0 &&
    undefinedColorUtilities.length === 0 &&
    unsafeColorContracts.length === 0 &&
    forbiddenDarkSemanticDeclarations.length === 0 &&
    undefinedCssVarReferences.length === 0

  const result = {
    ok,
    source: path.relative(repoRoot, sourcePath),
    summary: {
      utilitySourceScope: process.argv.includes('--all-source')
        ? 'all-source'
        : 'theme-surface',
      blocks: blocks.length,
      declarations: declarations.length,
      semanticRootDeclarations: semanticRootDeclarations.length,
      undefinedReferences: dedupeIssues(undefinedReferences).length,
      circularReferences: dedupeIssues(circularReferences).length,
      contrastChecks: rootContrast.checked + darkContrast.checked,
      contrastFailures: contrastFailures.length,
      contrastSkipped: contrastSkipped.length,
      undefinedColorUtilities: undefinedColorUtilities.length,
      unsafeColorContracts: unsafeColorContracts.length,
      forbiddenDarkSemanticDeclarations:
        forbiddenDarkSemanticDeclarations.length,
      undefinedCssVarReferences: undefinedCssVarReferences.length
    },
    undefinedReferences: dedupeIssues(undefinedReferences),
    circularReferences: dedupeIssues(circularReferences),
    undefinedColorUtilities,
    unsafeColorContracts,
    forbiddenDarkSemanticDeclarations,
    undefinedCssVarReferences,
    contrastFailures,
    contrastSkipped
  }

  console.log(JSON.stringify(result, null, 2))
  process.exit(ok ? 0 : 1)
}

main().catch(error => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        source: path.relative(repoRoot, sourcePath),
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  )
  process.exit(1)
})
