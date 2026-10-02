#!/usr/bin/env node
/**
 * Generate Utekos icon TSX components from SVG sources.
 * Normalizes presentation fills/strokes to currentColor.
 */
import fs from 'node:fs'
import path from 'node:path'

const ICONS_DIR = path.resolve(
  process.cwd(),
  'src/components/utekos-icons'
)
const SOURCES_DIR = path.join(ICONS_DIR, 'sources')

const SKIP_SVG = new Set(['Send.svg']) // SendIcon.tsx already maintained

function sanitizeStem(fileStem) {
  return fileStem
    .replace(/[()]/g, '')
    .replace(/=/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function toComponentName(fileStem) {
  const cleaned = sanitizeStem(fileStem)
  const special = {
    Checkmark: 'CheckMark',
    'Shooting star': 'ShootingStar',
    Shootingstar: 'ShootingStar',
    'Share social': 'ShareSocial',
    Sharesocial: 'ShareSocial',
    EInvoice1: 'EInvoiceAlt',
    Group1: 'GroupAlt',
    Phone1: 'PhoneAlt',
    'Returns-Outline1': 'ReturnsOutlineAlt',
    ReturnsOutline1: 'ReturnsOutlineAlt',
    'Tab bar=False': null,
    'Tab bar=True': null,
    'Tabbar=False': null,
    'Tabbar=True': null,
    PlatformAndroid: null,
    PlatformiOS: null,
  }
  if (special[cleaned] === null) {
    return null
  }
  if (special[cleaned]) {
    return `${special[cleaned]}Icon`
  }

  const parts = cleaned
    .split(/[-_\s]+/)
    .filter(Boolean)

  const pascal = parts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

  return `${pascal}Icon`
}

function toFileStem(componentName) {
  return componentName.replace(/Icon$/, '')
}

function normalizeSvgInner(svgText) {
  const openMatch = svgText.match(/<svg\b([^>]*)>/i)
  if (!openMatch) {
    throw new Error('Missing <svg> root element')
  }

  const attrs = openMatch[1]
  const viewBoxMatch = attrs.match(/viewBox=["']([^"']+)["']/i)
  const viewBox = viewBoxMatch?.[1] ?? '0 0 24 24'

  const innerStart = openMatch.index + openMatch[0].length
  const innerEnd = svgText.lastIndexOf('</svg>')
  let inner = svgText.slice(innerStart, innerEnd).trim()

  // Drop XML comments
  inner = inner.replace(/<!--[\s\S]*?-->/g, '')

  // Normalize presentation colors (keep defs/clipPath fills intact)
  inner = inner.replace(
    /\b(fill|stroke)=["'](?!none|currentColor)([^"']+)["']/gi,
    '$1="currentColor"'
  )

  return { viewBox, inner }
}

function generateTsx(componentName, { viewBox, inner }) {
  return `import { ICON_COLORS, type IconProps } from './icon-types'

export function ${componentName}({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="${viewBox}"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      ${inner}
    </svg>
  )
}
`
}

function regenerateIndex() {
  const components = fs
    .readdirSync(ICONS_DIR)
    .filter(name => name.endsWith('Icon.tsx'))
    .map(name => name.replace(/\.tsx$/, ''))
    .sort((a, b) => a.localeCompare(b))

  const lines = [
    'export {',
    '  ICON_COLORS,',
    '  type AppIcon,',
    '  type IconProps,',
    '  type IconTone,',
    "} from './icon-types'",
    ...components.map(name => `export { ${name} } from './${name}'`),
    '',
  ]

  fs.writeFileSync(path.join(ICONS_DIR, 'index.ts'), lines.join('\n'))
}

function generateFromSvgFile(svgPath, { force = false } = {}) {
  const fileName = path.basename(svgPath)
  if (SKIP_SVG.has(fileName)) {
    return { skipped: fileName, reason: 'skip list' }
  }

  const stem = path.basename(svgPath, '.svg')
  const componentName = toComponentName(stem)
  if (!componentName || !/^[A-Z][A-Za-z0-9]*Icon$/.test(componentName)) {
    return { skipped: path.basename(svgPath), reason: 'invalid component name' }
  }
  const tsxPath = path.join(ICONS_DIR, `${componentName}.tsx`)

  if (fs.existsSync(tsxPath) && !force) {
    return { skipped: fileName, reason: 'tsx exists' }
  }

  const svgText = fs.readFileSync(svgPath, 'utf8')
  const normalized = normalizeSvgInner(svgText)
  fs.writeFileSync(tsxPath, generateTsx(componentName, normalized))

  return { created: componentName, from: fileName }
}

function copyIfMissing(src, destName) {
  fs.mkdirSync(SOURCES_DIR, { recursive: true })
  const dest = path.join(SOURCES_DIR, destName.replace(/\s+/g, ''))
  if (fs.existsSync(dest)) {
    return null
  }
  fs.copyFileSync(src, dest)
  return destName
}

function main() {
  const args = process.argv.slice(2)
  const importDir = args.find(a => !a.startsWith('--'))
  const force = args.includes('--force')

  const results = { created: [], skipped: [], copied: [] }

  if (importDir) {
    const resolved = path.resolve(importDir)
    if (!fs.existsSync(resolved)) {
      console.error(`Import directory not found: ${resolved}`)
      process.exit(1)
    }

    for (const entry of fs.readdirSync(resolved)) {
      if (!entry.toLowerCase().endsWith('.svg')) continue
      const src = path.join(resolved, entry)
      const safeName = entry.replace(/\s+/g, '')
      const copied = copyIfMissing(src, safeName)
      if (copied) results.copied.push(copied)
    }
  }

  const svgRoots = [SOURCES_DIR, ICONS_DIR]
  for (const root of svgRoots) {
    if (!fs.existsSync(root)) continue
    for (const entry of fs.readdirSync(root)) {
      if (!entry.toLowerCase().endsWith('.svg')) continue
      const outcome = generateFromSvgFile(path.join(root, entry), { force })
    if (outcome.created) results.created.push(outcome.created)
      if (outcome.skipped && outcome.reason === 'skip list') {
        results.skipped.push(outcome.skipped)
      }
    }
  }

  regenerateIndex()

  console.log(JSON.stringify(results, null, 2))
}

main()
