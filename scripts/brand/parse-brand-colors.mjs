import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { converter, formatHex, parse, wcagContrast } from 'culori'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

const SOURCE_CSS_PATH = path.join(repoRoot, 'src/color-3.css')
const CSV_SOURCE_PATH = path.resolve(
  process.argv[2] ??
    process.env.BRAND_COLORS_CSV_PATH ??
    path.join(repoRoot, 'converted_colors.csv')
)
const OUTPUT_JSON_PATH = path.join(repoRoot, 'src/lib/brand/color-tokens.json')
const OUTPUT_DOC_PATH = path.join(repoRoot, 'docs/brand-colors.md')
const REFERENCE_BACKGROUND_HEX = '#010214'

const toRgb = converter('rgb')
const toOklab = converter('oklab')
const toOklch = converter('oklch')
const toLab = converter('lab')
const toLch = converter('lch')
const toHsl = converter('hsl')

const METHOD_TITLE_BY_COMMENT = new Map([
  ['HUE', 'Hue'],
  ['SATURATION', 'Saturation'],
  ['LIGHTNESS', 'Lightness'],
  ['ANALOGUES', 'Analogous'],
  ['ANALOGOUS', 'Analogous'],
  ['COMLEMENTARY', 'Complementary'],
  ['COMPLEMENTARY', 'Complementary'],
  ['MONOCHROMATIC', 'Monochromatic'],
  ['SPLIT COMLEMENTARY', 'Split Complementary'],
  ['SPLIT COMPLEMENTARY', 'Split Complementary'],
  ['TRIADIC', 'Triadic'],
  ['TETRADIC', 'Tetradic'],
  ['OTHER', 'Other'],
  ['ADOBE', 'Adobe'],
  ['HARMONIES', 'Harmonies'],
  ['SHADES', 'Shades'],
  ['TINTS', 'Tints'],
  ['TONES', 'Tones'],
  [
    'CROSS REFERENCE PMS PANTONE SOLID COATED `C`',
    'Pantone Solid Coated C'
  ],
  ['CROSS REFERENCE PMS PANTONE SOLID COATED C', 'Pantone Solid Coated C']
])

const SECTION_TITLE_OVERRIDES = new Map([
  ['MARITIME BLUE - UTEKOS TECHDOWN COLOR', 'Maritime Blue'],
  ['BAYERN BLUE', 'Bayern Blue'],
  ['MALIBU BLUE', 'Malibu Blue'],
  ['CAMPANULA', 'Campanula'],
  ['CUSTOM CAMPUNALA', 'Custom Campanula'],
  ['CUSTOM CAMPANULA', 'Custom Campanula'],
  ['CLOUD DANCER - COLOR OF THE YEAR 2026', 'Cloud Dancer'],
  ['PATRIOT BLUE - UTEKOS FJELBLÅ COLOR', 'Patriot Blue'],
  ['UTEKOS SVALE - PATCH COLOR', 'Utekos Svale'],
  ['DAZZLING BLUE - UTEKOS FJELLBLÅ INSIDE COLOR', 'Dazzling Blue'],
  ['ANTHRACITE - UTEKOS VARGNATT OUTSIDE COLOR', 'Anthracite'],
  ['MARITIME BLUE - COMPLEMENTARY COLORS', 'Maritime Blue Complementary'],
  ['MARITIME BLUE MONOCHROMATIC', 'Maritime Blue Monochromatic'],
  ['ANCIENT WATER', 'Ancient Water'],
  ['VERY-PERI - COLOR OF THE YEAR 2022', 'Very Peri'],
  ['POPPY RED - RHODAMINE RED', 'Poppy Red - Rhodamine Red'],
  ['SAND (WARM NEUTRALS)', 'Sand'],
  ['WARM SAND', 'Warm Sand'],
  ['SLATE (COOL NEUTRALS)', 'Slate'],
  ['SLATE NEUTRAL', 'Slate Neutral']
])

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/å/g, 'a')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeComment(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeCommentKey(value) {
  return normalizeComment(value)
    .replace(/[–—]/g, '-')
    .replace(/\s+-\s+/g, ' - ')
    .toUpperCase()
}

function toTitleCase(value) {
  const normalized = value
    .replace(/campunala/gi, 'Campanula')
    .replace(/comlementary/gi, 'Complementary')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) => {
      if (part === '-' || /^\s+$/.test(part)) {
        return part
      }

      const upperPart = part.toUpperCase()
      if (['PMS', 'C', 'OKLCH', 'OKLAB', 'APCA', 'PANTONE'].includes(upperPart)) {
        return upperPart
      }
      if (upperPart === 'UTEKOS') {
        return 'Utekos'
      }

      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join('')
}

function sectionTitleFromComment(comment) {
  const key = normalizeCommentKey(comment)
  if (SECTION_TITLE_OVERRIDES.has(key)) {
    return SECTION_TITLE_OVERRIDES.get(key)
  }

  const titleWithoutExplanatoryParentheses = normalizeComment(comment)
    .replace(/\s*\((warm|cool)\s+neutrals\)\s*/gi, '')
    .replace(/\s+-\s+color of the year\s+\d{4}$/gi, '')
    .replace(/\s+-\s+utekos\s+/gi, ' - Utekos ')

  return toTitleCase(titleWithoutExplanatoryParentheses)
}

function methodTitleFromComment(comment) {
  return METHOD_TITLE_BY_COMMENT.get(normalizeCommentKey(comment)) ?? null
}

function normalizeVariableName(cssVar) {
  return cssVar
    .replace(/^--color-/, '')
    .replace(/^--/, '')
    .toLowerCase()
}

function readableTokenName(name) {
  return toTitleCase(name.replace(/-/g, ' '))
}

function roundNumber(value, precision = 4) {
  if (!Number.isFinite(value)) {
    return null
  }

  return Number(value.toFixed(precision))
}

function cssNumber(value, precision = 4) {
  const rounded = roundNumber(value, precision)
  if (rounded === null) {
    return '0'
  }

  return String(rounded)
}

function csvNumber(value) {
  const trimmed = value?.trim()
  if (!trimmed) {
    return null
  }

  const number = Number(trimmed)
  return Number.isFinite(number) ? number : null
}

function parseCsvLine(line) {
  const cells = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]

    if (character === '"' && nextCharacter === '"') {
      current += '"'
      index += 1
      continue
    }

    if (character === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (character === ',' && !inQuotes) {
      cells.push(current)
      current = ''
      continue
    }

    current += character
  }

  cells.push(current)
  return cells.map((cell) => cell.trim())
}

async function readCsvMatches() {
  const csv = await readFile(CSV_SOURCE_PATH, 'utf8')
  const lines = csv.split(/\r?\n/).filter(Boolean)
  const header = parseCsvLine(lines[0])
  const indexByHeader = new Map(header.map((name, index) => [name, index]))
  const rowsByHex = new Map()

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line)
    const rawHex = cells[indexByHeader.get('Hex')] ?? ''
    const hex = rawHex.toLowerCase()

    if (!/^#[0-9a-f]{6}$/.test(hex)) {
      continue
    }

    rowsByHex.set(hex, {
      hex,
      rgb: {
        r: csvNumber(cells[indexByHeader.get('rgb (R)')]),
        g: csvNumber(cells[indexByHeader.get('rgb (G)')]),
        b: csvNumber(cells[indexByHeader.get('rgb (B)')])
      },
      oklab: {
        l: csvNumber(cells[indexByHeader.get('OKLAB (L)')]),
        a: csvNumber(cells[indexByHeader.get('OKLAB (A)')]),
        b: csvNumber(cells[indexByHeader.get('OKLAB (B)')])
      },
      oklch: {
        l: csvNumber(cells[indexByHeader.get('OKLCH (L)')]),
        c: csvNumber(cells[indexByHeader.get('OKLCh (C)')]),
        h: csvNumber(cells[indexByHeader.get('OKLCh (H)')])
      },
      cam02: {
        l: csvNumber(cells[indexByHeader.get('CAM02 (L)')]),
        a: csvNumber(cells[indexByHeader.get('CAM02 (A)')]),
        b: csvNumber(cells[indexByHeader.get('CAM02 (B)')]),
        c: csvNumber(cells[indexByHeader.get('CAM02 (C)')]),
        h: csvNumber(cells[indexByHeader.get('CAM02 (H)')])
      },
      cmyk: {
        c: csvNumber(cells[indexByHeader.get('cmyk (C)')]),
        m: csvNumber(cells[indexByHeader.get('cmyk (M)')]),
        y: csvNumber(cells[indexByHeader.get('cmyk (Y)')]),
        k: csvNumber(cells[indexByHeader.get('cmyk (K)')])
      },
      pantone: cells[indexByHeader.get('Pantone')] || null,
      csvRelativeLuminanceVsBackground: csvNumber(
        cells[indexByHeader.get(`Rel Lum vs ${REFERENCE_BACKGROUND_HEX}`)]
      ),
      apcaVsBackground: csvNumber(
        cells[indexByHeader.get(`APCA vs ${REFERENCE_BACKGROUND_HEX}`)]
      )
    })
  }

  return rowsByHex
}

function rgbToString(rgb) {
  if (!rgb || [rgb.r, rgb.g, rgb.b].some((value) => value === null)) {
    return null
  }

  return `rgb(${Math.round(rgb.r)} ${Math.round(rgb.g)} ${Math.round(rgb.b)})`
}

function rgbColorToString(color) {
  if (!color) {
    return null
  }

  return `rgb(${Math.round(color.r * 255)} ${Math.round(color.g * 255)} ${Math.round(
    color.b * 255
  )})`
}

function oklabToString(oklab) {
  if (!oklab || [oklab.l, oklab.a, oklab.b].some((value) => value === null)) {
    return null
  }

  return `oklab(${cssNumber(oklab.l)} ${cssNumber(oklab.a)} ${cssNumber(oklab.b)})`
}

function oklchToString(oklch) {
  if (!oklch || [oklch.l, oklch.c, oklch.h].some((value) => value === null)) {
    return null
  }

  return `oklch(${cssNumber(oklch.l)} ${cssNumber(oklch.c)} ${cssNumber(oklch.h, 2)})`
}

function labToString(lab) {
  if (!lab) {
    return null
  }

  return `lab(${cssNumber(lab.l, 2)} ${cssNumber(lab.a, 2)} ${cssNumber(lab.b, 2)})`
}

function lchToString(lch) {
  if (!lch) {
    return null
  }

  return `lch(${cssNumber(lch.l, 2)} ${cssNumber(lch.c, 2)} ${cssNumber(lch.h, 2)})`
}

function hslToString(hsl) {
  if (!hsl) {
    return null
  }

  return `hsl(${cssNumber(hsl.h ?? 0, 1)} ${cssNumber(hsl.s * 100, 1)}% ${cssNumber(
    hsl.l * 100,
    1
  )}%)`
}

function rgbToCmyk(rgb) {
  if (!rgb) {
    return null
  }

  const r = rgb.r
  const g = rgb.g
  const b = rgb.b
  const k = 1 - Math.max(r, g, b)

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 }
  }

  return {
    c: roundNumber(((1 - r - k) / (1 - k)) * 100, 1),
    m: roundNumber(((1 - g - k) / (1 - k)) * 100, 1),
    y: roundNumber(((1 - b - k) / (1 - k)) * 100, 1),
    k: roundNumber(k * 100, 1)
  }
}

function cmykToString(cmyk) {
  if (!cmyk || [cmyk.c, cmyk.m, cmyk.y, cmyk.k].some((value) => value === null)) {
    return null
  }

  return `cmyk(${cssNumber(cmyk.c, 1)}% ${cssNumber(cmyk.m, 1)}% ${cssNumber(
    cmyk.y,
    1
  )}% ${cssNumber(cmyk.k, 1)}%)`
}

function relativeLuminance(rgb) {
  if (!rgb) {
    return null
  }

  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    if (channel <= 0.03928) {
      return channel / 12.92
    }

    return ((channel + 0.055) / 1.055) ** 2.4
  })

  return roundNumber(0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2], 4)
}

function colorValuesFromHex(hex, csvMatch) {
  const color = parse(hex)
  const rgb = toRgb(color)
  const oklab = toOklab(color)
  const oklch = toOklch(color)
  const lab = toLab(color)
  const lch = toLch(color)
  const hsl = toHsl(color)
  const computedCmyk = rgbToCmyk(rgb)

  return {
    rgb: csvMatch ? rgbToString(csvMatch.rgb) : rgbColorToString(rgb),
    oklab: csvMatch ? oklabToString(csvMatch.oklab) : oklabToString(oklab),
    oklch: csvMatch ? oklchToString(csvMatch.oklch) : oklchToString(oklch),
    lab: labToString(lab),
    lch: lchToString(lch),
    hsl: hslToString(hsl),
    cmyk: {
      value: csvMatch ? cmykToString(csvMatch.cmyk) : cmykToString(computedCmyk),
      source: csvMatch ? 'converted_colors.csv' : 'computed'
    },
    pantone: csvMatch?.pantone ?? null,
    cam02: csvMatch
      ? `cam02(${cssNumber(csvMatch.cam02.l)} ${cssNumber(
          csvMatch.cam02.a
        )} ${cssNumber(csvMatch.cam02.b)} / ${cssNumber(
          csvMatch.cam02.c
        )} ${cssNumber(csvMatch.cam02.h, 2)})`
      : null,
    relativeLuminance: relativeLuminance(rgb),
    csvRelativeLuminanceVsBackground:
      csvMatch?.csvRelativeLuminanceVsBackground ?? null,
    apcaVsBackground: csvMatch?.apcaVsBackground ?? null,
    wcagContrastVsBackground: roundNumber(wcagContrast(hex, REFERENCE_BACKGROUND_HEX), 2),
    matchedCsv: Boolean(csvMatch)
  }
}

function resolveCssValue(value, variableMap, seen = new Set()) {
  const variableMatch = value.match(/^var\((--[A-Za-z0-9_-]+)\)$/)
  if (!variableMatch) {
    return value.trim()
  }

  const variableName = variableMatch[1]
  if (seen.has(variableName)) {
    return value.trim()
  }

  const nextValue = variableMap.get(variableName)
  if (!nextValue) {
    return value.trim()
  }

  seen.add(variableName)
  return resolveCssValue(nextValue, variableMap, seen)
}

function safeHexFromValue(value) {
  const color = parse(value)

  if (!color) {
    return null
  }

  try {
    return formatHex(color).toLowerCase()
  } catch {
    return null
  }
}

function createRelationship(section, group, token, occurrence) {
  const scaleMatch = token.name.match(/^(.*?)-([0-9]{2,3})$/)
  return {
    sectionId: section.id,
    sectionTitle: section.title,
    groupId: group.id,
    groupTitle: group.title,
    method: group.method,
    occurrence,
    role: scaleMatch ? 'scale-step' : group.method === 'pantone' ? 'print-reference' : 'source-token',
    scaleBase: scaleMatch ? scaleMatch[1] : null,
    scaleStep: scaleMatch ? Number(scaleMatch[2]) : null
  }
}

function buildDerivedPaletteColor(hex, label, oklch) {
  const color = {
    mode: 'oklch',
    l: Math.max(0, Math.min(1, oklch.l)),
    c: Math.max(0, oklch.c),
    h: ((oklch.h ?? 0) + 360) % 360
  }

  return {
    label,
    hex: formatHex(color).toLowerCase(),
    oklch: oklchToString(color)
  }
}

function buildDerivedPalettes(baseToken) {
  if (!baseToken?.hex) {
    return []
  }

  const base = toOklch(parse(baseToken.hex))
  if (!base || !Number.isFinite(base.l) || !Number.isFinite(base.c)) {
    return []
  }

  const hue = Number.isFinite(base.h) ? base.h : 0
  const tintSteps = [0, 0.25, 0.5, 0.75, 1]
  const hueOffsets = [-45, -30, -15, 0, 15, 30, 45]

  return [
    {
      id: 'tints',
      title: 'Tints',
      method:
        'OKLCH interpolation: lyshet trekkes mot 0.98 og chroma dempes forsiktig.',
      colors: tintSteps.map((step) =>
        buildDerivedPaletteColor(baseToken.hex, `${Math.round(step * 100)}%`, {
          l: base.l + (0.98 - base.l) * step,
          c: base.c + (Math.min(base.c, 0.02) - base.c) * step,
          h: hue
        })
      )
    },
    {
      id: 'shades',
      title: 'Shades',
      method:
        'OKLCH interpolation: lyshet trekkes mot 0.12 og chroma reduseres for trygge mørke trinn.',
      colors: tintSteps.map((step) =>
        buildDerivedPaletteColor(baseToken.hex, `${Math.round(step * 100)}%`, {
          l: base.l + (0.12 - base.l) * step,
          c: base.c + (base.c * 0.65 - base.c) * step,
          h: hue
        })
      )
    },
    {
      id: 'tones',
      title: 'Tones',
      method:
        'OKLCH interpolation: chroma trekkes mot nøytral akse mens lyshet bevares.',
      colors: tintSteps.map((step) =>
        buildDerivedPaletteColor(baseToken.hex, `${Math.round(step * 100)}%`, {
          l: base.l,
          c: base.c * (1 - step),
          h: hue
        })
      )
    },
    {
      id: 'hue-shift',
      title: 'Hue Shifts',
      method:
        'OKLCH hue-rotasjon rundt eksisterende lyshet og chroma for praktiske harmonier.',
      colors: hueOffsets.map((offset) =>
        buildDerivedPaletteColor(baseToken.hex, `${offset > 0 ? '+' : ''}${offset}°`, {
          l: base.l,
          c: base.c,
          h: hue + offset
        })
      )
    }
  ]
}

function buildSourceReference(value) {
  return {
    file: 'src/color-3.css',
    rawValue: value
  }
}

function inferredSectionTitleFromTokenName(name) {
  if (name.startsWith('poppy-red-') || name.startsWith('rhodamine-red-')) {
    return 'Poppy Red - Rhodamine Red'
  }

  return null
}

function addTokenToSection({ section, token, relationship }) {
  const key = `${token.cssVar}|${token.resolvedValue}`
  const existing = section.tokenByKey.get(key)

  if (existing) {
    const hasRelationship = existing.relationships.some(
      (entry) =>
        entry.sectionId === relationship.sectionId &&
        entry.groupId === relationship.groupId &&
        entry.occurrence === relationship.occurrence
    )

    if (!hasRelationship) {
      existing.relationships.push(relationship)
    }

    return
  }

  section.tokenByKey.set(key, {
    ...token,
    relationships: [relationship]
  })
}

async function buildBrandColorData() {
  const [sourceCss, csvMatches] = await Promise.all([
    readFile(SOURCE_CSS_PATH, 'utf8'),
    readCsvMatches()
  ])

  const declarationRegex = /(--[A-Za-z0-9_-]+)\s*:\s*([^;]+);/g
  const variableMap = new Map()
  for (const match of sourceCss.matchAll(declarationRegex)) {
    variableMap.set(match[1], match[2].trim())
  }

  const sections = []
  let currentSection = null
  let currentGroup = null
  let occurrence = 0

  function ensureSection(title = 'Brand Colors', sourceTitle = 'Brand Colors') {
    if (currentSection) {
      return currentSection
    }

    const id = slugify(title)
    currentSection = {
      id,
      title,
      sourceTitle,
      tokenByKey: new Map(),
      groups: []
    }
    sections.push(currentSection)
    currentGroup = {
      id: `${id}-tokens`,
      title: 'Tokens',
      method: 'tokens'
    }
    currentSection.groups.push(currentGroup)
    return currentSection
  }

  function startSection(comment) {
    const title = sectionTitleFromComment(comment)
    startSectionFromTitle(title, normalizeComment(comment))
  }

  function startSectionFromTitle(title, sourceTitle) {
    const finalTitle =
      title === 'Maritime Blue' && sections.some((section) => section.title === title)
        ? 'Maritime Blue Scale'
        : title
    const idBase = slugify(finalTitle)
    const duplicateCount = sections.filter((section) => section.id.startsWith(idBase)).length
    const id = duplicateCount === 0 ? idBase : `${idBase}-${duplicateCount + 1}`

    currentSection = {
      id,
      title: finalTitle,
      sourceTitle,
      tokenByKey: new Map(),
      groups: []
    }
    sections.push(currentSection)
    currentGroup = {
      id: `${id}-tokens`,
      title: 'Tokens',
      method: 'tokens'
    }
    currentSection.groups.push(currentGroup)
  }

  function startGroup(comment) {
    const section = ensureSection()
    const title = methodTitleFromComment(comment) ?? 'Tokens'
    const idBase = `${section.id}-${slugify(title)}`
    const duplicateCount = section.groups.filter((group) => group.id.startsWith(idBase)).length
    currentGroup = {
      id: duplicateCount === 0 ? idBase : `${idBase}-${duplicateCount + 1}`,
      title,
      method: slugify(title)
    }
    section.groups.push(currentGroup)
  }

  const eventRegex = /\/\*([\s\S]*?)\*\/|(--[A-Za-z0-9_-]+)\s*:\s*([^;]+);/g
  for (const match of sourceCss.matchAll(eventRegex)) {
    if (match[1] !== undefined) {
      const comment = normalizeComment(match[1])
      if (!comment) {
        continue
      }

      if (methodTitleFromComment(comment)) {
        startGroup(comment)
      } else {
        startSection(comment)
      }
      continue
    }

    const cssVar = match[2]
    const value = match[3].trim()

    if (cssVar === '--HEX') {
      continue
    }

    const resolvedValue = resolveCssValue(value, variableMap)
    const hex = safeHexFromValue(resolvedValue)
    const name = normalizeVariableName(cssVar)
    const inferredSectionTitle = inferredSectionTitleFromTokenName(name)
    if (inferredSectionTitle && currentSection?.title !== inferredSectionTitle) {
      startSectionFromTitle(inferredSectionTitle, 'Inferred from token names in src/color-3.css')
    }

    const section = ensureSection()
    const group = currentGroup ?? section.groups[0]
    occurrence += 1

    const csvMatch = hex ? csvMatches.get(hex) : null
    const values = hex
      ? colorValuesFromHex(hex, csvMatch)
      : {
          rgb: null,
          oklab: null,
          oklch: null,
          lab: null,
          lch: null,
          hsl: null,
          cmyk: { value: null, source: null },
          pantone: null,
          cam02: null,
          relativeLuminance: null,
          csvRelativeLuminanceVsBackground: null,
          apcaVsBackground: null,
          wcagContrastVsBackground: null,
          matchedCsv: false
        }

    const token = {
      id: `${section.id}-${slugify(name)}-${occurrence}`,
      cssVar,
      name,
      label: readableTokenName(name),
      value,
      resolvedValue,
      hex,
      hexVar: null,
      rgb: values.rgb,
      oklab: values.oklab,
      oklch: values.oklch,
      lab: values.lab,
      lch: values.lch,
      hsl: values.hsl,
      cmyk: values.cmyk,
      pantone: values.pantone,
      cam02: values.cam02,
      relativeLuminance: values.relativeLuminance,
      csvRelativeLuminanceVsBackground: values.csvRelativeLuminanceVsBackground,
      apcaVsBackground: values.apcaVsBackground,
      wcagContrastVsBackground: values.wcagContrastVsBackground,
      matchedCsv: values.matchedCsv,
      source: buildSourceReference(value)
    }

    addTokenToSection({
      section,
      token,
      relationship: createRelationship(section, group, token, occurrence)
    })
  }

  const normalizedSections = sections
    .map((section) => {
      const tokens = Array.from(section.tokenByKey.values())
      const derivedBaseToken =
        tokens.find(
          (token) =>
            token.hex &&
            !token.name.startsWith('pantone') &&
            token.relationships.some((relationship) => relationship.groupTitle === 'Tokens')
        ) ??
        tokens.find((token) => token.hex && !token.name.startsWith('pantone')) ??
        null

      return {
        id: section.id,
        title: section.title,
        sourceTitle: section.sourceTitle,
        groups: section.groups,
        tokens,
        derivedPalettes: buildDerivedPalettes(derivedBaseToken)
      }
    })
    .filter((section) => section.tokens.length > 0)

  const allTokens = normalizedSections.flatMap((section) => section.tokens)
  const uniqueHex = new Set(allTokens.map((token) => token.hex).filter(Boolean))
  const uniqueCssVars = new Set(allTokens.map((token) => token.cssVar))
  const csvMatchedHex = new Set(
    allTokens.filter((token) => token.matchedCsv).map((token) => token.hex)
  )

  return {
    generatedAt: new Date().toISOString(),
    source: 'src/color-3.css',
    csvSource: path.basename(CSV_SOURCE_PATH),
    referenceBackground: REFERENCE_BACKGROUND_HEX,
    generationNotes: [
      'src/color-3.css is the primary source for displayed Utekos brand tokens.',
      'converted_colors.csv enriches matching HEX values with Pantone, CMYK, OKLab, OKLCH, CAM02 and APCA data.',
      'Non-matching CSS colors are retained and marked with matchedCsv=false.',
      'Derived tints, shades, tones and hue shifts are generated locally in OKLCH for documentation, not as production Tailwind tokens.'
    ],
    stats: {
      sectionCount: normalizedSections.length,
      tokenCount: allTokens.length,
      uniqueHexCount: uniqueHex.size,
      uniqueCssVarCount: uniqueCssVars.size,
      csvMatchedHexCount: csvMatchedHex.size,
      pantoneCount: allTokens.filter((token) => token.pantone).length
    },
    sections: normalizedSections
  }
}

function formatNullable(value) {
  return value ?? '—'
}

function renderMarkdown(data) {
  const lines = [
    '# Utekos Brand Colors',
    '',
    `Generated from \`${data.source}\` with CSV enrichment from \`${data.csvSource}\`.`,
    '',
    `Reference background for WCAG contrast: \`${data.referenceBackground}\`.`,
    '',
    '| Section | Token | Group | HEX | OKLCH | Pantone | WCAG | CSV |',
    '| --- | --- | --- | --- | --- | --- | ---: | --- |'
  ]

  for (const section of data.sections) {
    for (const token of section.tokens) {
      const relationship = token.relationships[0]
      lines.push(
        `| ${section.title} | \`${token.cssVar}\` | ${relationship.groupTitle} | ${
          token.hex ?? '—'
        } | ${formatNullable(token.oklch)} | ${formatNullable(token.pantone)} | ${
          token.wcagContrastVsBackground ?? '—'
        } | ${token.matchedCsv ? 'yes' : 'no'} |`
      )
    }
  }

  lines.push('')
  return lines.join('\n')
}

const data = await buildBrandColorData()
await mkdir(path.dirname(OUTPUT_JSON_PATH), { recursive: true })
await mkdir(path.dirname(OUTPUT_DOC_PATH), { recursive: true })
await writeFile(OUTPUT_JSON_PATH, `${JSON.stringify(data, null, 2)}\n`)
await writeFile(OUTPUT_DOC_PATH, renderMarkdown(data))

console.log(
  `Brand colors synced: ${data.stats.sectionCount} sections, ${data.stats.tokenCount} tokens, ${data.stats.csvMatchedHexCount} CSV HEX matches.`
)
