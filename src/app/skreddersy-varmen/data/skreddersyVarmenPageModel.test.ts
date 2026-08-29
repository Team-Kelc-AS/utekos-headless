import assert from 'node:assert/strict'
import test from 'node:test'

const seo = {
  title: 'Utekos TechDown™ – Skreddersy varmen',
  socialTitle: 'Utekos TechDown™ – Skreddersy varmen | Utekos',
  description:
    'Oppdag Utekos TechDown™ – tilpass passform og ventilasjon med unik 3-i-1-funksjonalitet.',
  canonical: 'https://utekos.no/skreddersy-varmen',
  socialImage: {
    url: 'https://utekos.no/og-image-skreddersy-varmen.jpg',
    width: 1200,
    height: 630,
    type: 'image/jpeg',
    alt: 'To personer i mørkeblå Utekos TechDown™ sitter ute på en terrasse.'
  }
} as const

const scenes = [
  {
    id: 'fullengde',
    stepNumber: '01',
    modeName: 'Fullengdemodus',
    title: 'Maksimal isolasjon',
    imageAlt: 'Utekos TechDown™ i fullengdemodus.',
    description: 'En isolerende kokong.'
  },
  {
    id: 'oppjustert',
    stepNumber: '02',
    modeName: 'Oppjustert modus',
    title: 'Umiddelbar mobilitet',
    imageAlt: 'Utekos TechDown™ i oppjustert modus.',
    description: 'Beveg deg uten å miste varmen.'
  },
  {
    id: 'parkas',
    stepNumber: '03',
    modeName: 'Parkasmodus',
    title: 'Selvformet eleganse',
    imageAlt: 'Utekos TechDown™ i parkasmodus.',
    description: 'Full bevegelsesfrihet.'
  }
] as const

const empathyScenes = [
  {
    id: 'moment',
    kind: 'text',
    copy: 'Når øyeblikket er for godt til å avsluttes.'
  },
  {
    id: 'recognition',
    kind: 'text',
    copy: 'Du kjenner følelsen.'
  },
  {
    id: 'bonfire-copy',
    kind: 'text',
    copy: 'Praten går lett rundt bålpannen.'
  },
  {
    id: 'bonfire',
    kind: 'media',
    copy: 'Flammene danser og roen har senket seg.',
    imageSrc:
      '/src/assets/images/techdown/SkreddersyVarmen-1.webp',
    imageAlt:
      'Bålpanne med levende flammer og to personer i mørkeblå Utekos TechDown™ i bakgrunnen.'
  },
  {
    id: 'chill',
    kind: 'media',
    copy: 'Så kommer den snikende trekken som truer med å bryte magien.',
    imageSrc:
      '/src/assets/images/techdown/UtekosTechDownMElegense.webp',
    imageAlt:
      'Kvinne i mørkeblå Utekos TechDown™ sitter ute ved vannet i kjølig kveldsluft.'
  },
  {
    id: 'question',
    kind: 'text',
    copy: '“Det begynner å bli kaldt. Skal vi trekke inn?”'
  }
] as const

const empathyResolution = {
  opening: 'Med Utekos® blir svaret enkelt.',
  steps: [
    'Tilpass passform',
    'Reguler ventilasjon',
    'Velg mellom ulike funksjonelle moduser.'
  ],
  statement:
    'Skreddersy varmen for å fortsette opplevelsen av kompromissløs komfort.',
  emphasis: 'Helt uavbrutt.',
  closing: 'Juster, form og nyt.'
} as const

async function loadPageModel() {
  return import('./skreddersyVarmenPageModel').catch(() => null)
}

test('builds canonical social metadata from MDX frontmatter', async () => {
  const pageModel = await loadPageModel()

  assert.ok(
    pageModel,
    'the typed MDX page model must be implemented'
  )

  const metadata = pageModel.buildSkreddersyVarmenMetadata(seo)

  assert.deepEqual(metadata.title, { absolute: seo.title })
  assert.deepEqual(metadata.alternates, {
    canonical: seo.canonical
  })
  assert.equal(metadata.openGraph?.title, seo.socialTitle)
  assert.deepEqual(metadata.openGraph?.images, [seo.socialImage])
  assert.equal(metadata.twitter?.title, seo.socialTitle)
  assert.deepEqual(metadata.twitter?.images, [seo.socialImage])
})

test('accepts exactly the three editorial modes in their theatre order', async () => {
  const pageModel = await loadPageModel()

  assert.ok(
    pageModel,
    'the typed MDX page model must be implemented'
  )

  const parsed = pageModel.parseThreeModeScenes(scenes)

  assert.deepEqual(
    parsed.map(scene => ({
      id: scene.id,
      transition: scene.transition
    })),
    [
      { id: 'fullengde', transition: 'static' },
      { id: 'oppjustert', transition: 'vertical-curtain' },
      { id: 'parkas', transition: 'horizontal-door' }
    ]
  )
})

test('rejects MDX scene content with a missing mode', async () => {
  const pageModel = await loadPageModel()

  assert.ok(
    pageModel,
    'the typed MDX page model must be implemented'
  )

  assert.throws(
    () => pageModel.parseThreeModeScenes(scenes.slice(0, 2)),
    /fullengde, oppjustert og parkas/i
  )
})

test('rejects a theatre image without editorial alt text', async () => {
  const pageModel = await loadPageModel()

  assert.ok(
    pageModel,
    'the typed MDX page model must be implemented'
  )

  const { imageAlt: _imageAlt, ...firstSceneWithoutAlt } =
    scenes[0]
  const sceneWithoutAlt = [
    firstSceneWithoutAlt,
    ...scenes.slice(1)
  ]

  assert.throws(
    () => pageModel.parseThreeModeScenes(sceneWithoutAlt),
    /alternativ tekst/i
  )
})

test('accepts exactly six empathy scenes in narrative order', async () => {
  const pageModel = await loadPageModel()

  assert.ok(
    pageModel,
    'the typed MDX page model must be implemented'
  )

  const parsed = pageModel.parseEmpathyScenes(empathyScenes)

  assert.deepEqual(
    parsed.map(scene => ({ id: scene.id, kind: scene.kind })),
    [
      { id: 'moment', kind: 'text' },
      { id: 'recognition', kind: 'text' },
      { id: 'bonfire-copy', kind: 'text' },
      { id: 'bonfire', kind: 'media' },
      { id: 'chill', kind: 'media' },
      { id: 'question', kind: 'text' }
    ]
  )

  assert.equal(
    parsed[2]?.copy,
    'Praten går lett rundt bålpannen.'
  )
  assert.equal(
    parsed[3]?.copy,
    'Flammene danser og roen har senket seg.'
  )
  assert.equal(parsed[5]?.kind, 'text')
  assert.equal('imageSrc' in parsed[5]!, false)
})

test('rejects an empathy scene with missing editorial alt text', async () => {
  const pageModel = await loadPageModel()

  assert.ok(
    pageModel,
    'the typed MDX page model must be implemented'
  )

  const { imageAlt: _imageAlt, ...bonfireWithoutAlt } =
    empathyScenes[3]
  const invalidScenes = [
    ...empathyScenes.slice(0, 3),
    bonfireWithoutAlt,
    ...empathyScenes.slice(4)
  ]

  assert.throws(
    () => pageModel.parseEmpathyScenes(invalidScenes),
    /alternativ tekst/i
  )
})

test('rejects an incomplete empathy narrative', async () => {
  const pageModel = await loadPageModel()

  assert.ok(
    pageModel,
    'the typed MDX page model must be implemented'
  )

  assert.throws(
    () =>
      pageModel.parseEmpathyScenes(empathyScenes.slice(0, 4)),
    /seks empatiscener/i
  )
})

test('parses MDX frontmatter into the typed landing page model', async () => {
  const pageModel = await loadPageModel()

  assert.ok(
    pageModel,
    'the typed MDX page model must be implemented'
  )

  const parsed = pageModel.parseSkreddersyVarmenPageContent({
    seo,
    hero: {
      headline: 'Skreddersy varmen.',
      accent: 'Forleng kvelden.',
      leadFirst: 'Kompromissløs komfort',
      leadSecond: 'og overlegen allsidighet.'
    },
    empathy: {
      scenes: empathyScenes,
      resolution: empathyResolution
    },
    threeInOne: {
      eyebrow: 'Adaptiv funksjonalitet',
      heading: 'Friheten til å velge',
      introduction: 'Det unike med Utekos® er transformasjonen.',
      lastUpdated: '2026-08-12',
      lastUpdatedLabel: '12. august 2026',
      scenes
    }
  })

  assert.equal(parsed.seo.title, seo.title)
  assert.equal(parsed.empathy.scenes.length, 6)
  assert.deepEqual(parsed.empathy.resolution.steps, [
    'Tilpass passform',
    'Reguler ventilasjon',
    'Velg mellom ulike funksjonelle moduser.'
  ])
  assert.equal(
    parsed.empathy.resolution.emphasis,
    'Helt uavbrutt.'
  )
  assert.equal(parsed.threeInOne.scenes[0]?.id, 'fullengde')
})

test('rejects MDX frontmatter that is missing required hero copy', async () => {
  const pageModel = await loadPageModel()

  assert.ok(
    pageModel,
    'the typed MDX page model must be implemented'
  )

  assert.throws(
    () =>
      pageModel.parseSkreddersyVarmenPageContent({
        seo,
        empathy: {},
        threeInOne: { scenes }
      }),
    /hero/i
  )
})

test('retains the canonical PromotionImpression identifiers', async () => {
  const pageModel = await loadPageModel()

  assert.ok(
    pageModel,
    'the typed MDX page model must be implemented'
  )

  assert.deepEqual(pageModel.SKREDDERSY_VARMEN_PROMOTIONS, {
    hero: 'skreddersy-varmen-hero',
    empathy: 'skreddersy-varmen-empathy',
    threeInOne: 'skreddersy-varmen-three-in-one',
    techDown: 'skreddersy-varmen-techdown',
    purchase: 'skreddersy-varmen-purchase',
    purchaseButton: 'skreddersy-varmen-purchase-button',
    socialProof: 'skreddersy-varmen-social-proof'
  })
})
