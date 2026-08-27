import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const routeDirectory = new URL('./', import.meta.url)

function readRouteFile(fileName: string) {
  return readFileSync(new URL(fileName, routeDirectory), 'utf8')
}

function readComponentBodyByTitle(
  source: string,
  componentName: string,
  title: string
) {
  const componentPattern = new RegExp(
    `<${componentName}\\b([\\s\\S]*?)>([\\s\\S]*?)<\\/${componentName}>`,
    'g'
  )

  for (const match of source.matchAll(componentPattern)) {
    if (match[1]?.includes(`title='${title}'`)) {
      return match[2]?.trim().replace(/\s+/g, ' ') ?? ''
    }
  }

  throw new Error(`Missing ${componentName} titled ${title}`)
}

test('removes the blurred reflective hero background', () => {
  const hero = readRouteFile('components/TechHero.tsx')

  assert.doesNotMatch(hero, /blur-\[/)
  assert.doesNotMatch(hero, /bg-secondary\/20 blur/)
  assert.doesNotMatch(hero, /bg-accent\/20 blur/)
  assert.doesNotMatch(
    hero,
    /pointer-events-none absolute inset-0 overflow-hidden/
  )
})

test('stages the hero as a measured two-act story', () => {
  const hero = readRouteFile('components/TechHero.tsx')
  const animation = readRouteFile(
    'components/TechHero.module.css'
  )

  assert.match(hero, /styles\.badgeEntrance/)
  assert.match(hero, /data-story-beat='lead'/)
  assert.match(hero, /data-story-beat='reveal'/)
  assert.match(
    hero,
    /aria-label=\{`\$\{headlineLead\} \$\{headlineReveal\}`\}/
  )
  assert.equal(hero.match(/<h1\b/g)?.length, 1)
  assert.match(hero, /border-0!/)
  assert.match(animation, /animation-delay: 80ms/)
  assert.match(
    animation,
    /lead-arrival 780ms[\s\S]*?260ms forwards/
  )
  assert.match(
    animation,
    /reveal-arrival 900ms[\s\S]*?1840ms forwards/
  )
  assert.match(
    animation,
    /supporting-entrance 700ms[\s\S]*?2880ms forwards/
  )
  assert.doesNotMatch(hero, /animate-bounce/)
  assert.match(animation, /prefers-reduced-motion: reduce/)
})

test('keeps route composition and editorial story inputs in MDX', () => {
  const page = readRouteFile('page.mdx')
  const hero = readRouteFile('HeroSection.mdx')
  const modes = readRouteFile('ExperienceModes.mdx')
  const technology = readRouteFile('TechnologySection.mdx')
  const navigation = readRouteFile('NavigationSection.mdx')

  assert.equal(
    existsSync(new URL('page.tsx', routeDirectory)),
    false
  )
  assert.match(page, /<HeroSection \/>/)
  assert.match(page, /<ExperienceModes \/>/)
  assert.match(page, /<TechnologySection \/>/)
  assert.match(page, /<NavigationSection \/>/)
  assert.match(hero, /headlineLead='Ett plagg\.'/)
  assert.match(hero, /headlineReveal='Endeløse muligheter\.'/)
  assert.doesNotMatch(hero, /^# /m)
  assert.doesNotMatch(hero, /Tre opplevelser/)
  assert.match(modes, /<MdxColumns[\s\S]*?columns=\{3\}/)
  assert.match(technology, /^## Kvalitet i hver fiber/m)
  assert.match(technology, /title='Luméa™ Shell'/)
  assert.match(
    technology,
    /title='HydroGuard™ Shell \(8000mm\)'/
  )
  assert.match(technology, /title='Taffeta innerfôr'/)
  assert.match(navigation, /<NavigationCtaCard/)
  assert.equal(
    existsSync(new URL('config.ts', routeDirectory)),
    false
  )
  assert.equal(
    existsSync(new URL('types/index.ts', routeDirectory)),
    false
  )
})

test('retains the stateful material visual as the narrow client boundary', () => {
  const productSpecs = readRouteFile(
    'components/ProductSpecsView.tsx'
  )
  const technologyBlock = readRouteFile(
    'components/TechnoloyBlock.tsx'
  )

  assert.match(productSpecs, /^'use client'/)
  assert.match(productSpecs, /IntersectionObserver/)
  assert.match(productSpecs, /<ProductLayersVisual/)
  assert.match(technologyBlock, /^'use client'/)
  assert.match(technologyBlock, /useActiveTechnology/)
})

test('uses the requested route surfaces and mobile card discovery', () => {
  const modes = readRouteFile('ExperienceModes.mdx')
  const modeCard = readRouteFile(
    'components/ExperienceModeCard.tsx'
  )
  const technologyBlock = readRouteFile(
    'components/TechnoloyBlock.tsx'
  )
  const technologyGroup = readRouteFile(
    'components/TechnologyGroup.tsx'
  )

  assert.match(modes, /auto-cols-\[100%\]/)
  assert.match(modes, /snap-mandatory/)
  assert.match(modes, /md:grid-cols-3/)
  assert.match(modeCard, /snap-start/)
  assert.match(modeCard, /bg-jungle/)
  assert.match(technologyBlock, /bg-jungle/)
  assert.match(technologyBlock, /bg-dark-teal/)
  assert.match(technologyBlock, /bg-muted/)
  assert.match(technologyBlock, /bg-green-haze/)
  assert.match(technologyBlock, /px-4 py-2/)
  assert.match(technologyGroup, /tracking-normal/)
  assert.doesNotMatch(technologyGroup, /tracking-widest/)
})

test('keeps the requested concise editorial copy', () => {
  const modes = readRouteFile('ExperienceModes.mdx')
  const technology = readRouteFile('TechnologySection.mdx')

  assert.equal(
    readComponentBodyByTitle(
      modes,
      'ExperienceModeCard',
      '3. Parkasmodus'
    ),
    'Trekk den opp til parkas og ta varmen med deg – med full bevegelsesfrihet og et elegant snitt.'
  )
  assert.doesNotMatch(modes, /For turer og lengre avstander/)
  assert.match(technology, /utekos starter med total komfort\./)
  assert.doesNotMatch(
    technology,
    /Her kan du utforske funksjonaliteten/
  )
  assert.match(
    technology,
    /Et tettvevd ytterstoff i nylon med matt finish/
  )
  assert.doesNotMatch(
    technology,
    /Vårt mest eksklusive ytterstoff/
  )
})

test('keeps every selected card description to one sentence', () => {
  const modes = readRouteFile('ExperienceModes.mdx')
  const technology = readRouteFile('TechnologySection.mdx')
  const selectedDescriptions = [
    ...[
      '1. Fullengdemodus',
      '2. Oppjustert modus',
      '3. Parkasmodus'
    ].map(title =>
      readComponentBodyByTitle(
        modes,
        'ExperienceModeCard',
        title
      )
    ),
    ...[
      'CloudWeave™ Insulation',
      'Fillpower 650 – Termisk effektivitet',
      'DWR Performance Nylon',
      'DuraLite™ Nylon (20D/380T)',
      'Hurtigtørkende fiber',
      'HydroGuard™ Shell (8000mm)',
      'SherpaCore™ Thermal Lining',
      'Teknisk konstruksjon',
      '3-i-1 adaptiv funksjonalitet',
      'Taffeta innerfôr'
    ].map(title =>
      readComponentBodyByTitle(
        technology,
        'TechnologyBlock',
        title
      )
    )
  ]

  assert.equal(selectedDescriptions.length, 13)
  for (const description of selectedDescriptions) {
    assert.equal(
      description.match(/[.!?](?=\s|$)/g)?.length ?? 0,
      1,
      description
    )
  }
})
