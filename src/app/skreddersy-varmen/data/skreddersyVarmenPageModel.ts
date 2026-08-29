import type { Metadata } from 'next'
import { z } from 'zod'

export const SKREDDERSY_VARMEN_PROMOTIONS = {
  hero: 'skreddersy-varmen-hero',
  empathy: 'skreddersy-varmen-empathy',
  threeInOne: 'skreddersy-varmen-three-in-one',
  techDown: 'skreddersy-varmen-techdown',
  purchase: 'skreddersy-varmen-purchase',
  socialProof: 'skreddersy-varmen-social-proof'
} as const

export type SkreddersyVarmenSeoContent = {
  title: string
  socialTitle: string
  description: string
  canonical: string
  socialImage: {
    url: string
    width: number
    height: number
    type: string
    alt: string
  }
}

export type ThreeModeSceneId =
  | 'fullengde'
  | 'oppjustert'
  | 'parkas'

export type ThreeModeTransition =
  | 'static'
  | 'vertical-curtain'
  | 'horizontal-door'

export type ThreeModeSceneContent = {
  id: ThreeModeSceneId
  stepNumber: string
  modeName: string
  title: string
  imageAlt: string
  description: string
}

export type ThreeModeScene = ThreeModeSceneContent & {
  transition: ThreeModeTransition
}

export type EmpathyTextSceneId =
  | 'moment'
  | 'recognition'
  | 'bonfire-copy'
  | 'question'

export type EmpathyMediaSceneId = 'bonfire' | 'chill'

export type EmpathyMediaImageSrc =
  | '/src/assets/images/techdown/SkreddersyVarmen-1.webp'
  | '/src/assets/images/techdown/UtekosTechDownMElegense.webp'

export type EmpathyTextSceneContent = {
  id: EmpathyTextSceneId
  kind: 'text'
  copy: string
}

export type EmpathyMediaSceneContent = {
  id: EmpathyMediaSceneId
  kind: 'media'
  copy: string
  imageSrc: EmpathyMediaImageSrc
  imageAlt: string
}

export type EmpathySceneContent =
  | EmpathyTextSceneContent
  | EmpathyMediaSceneContent

export type EmpathyResolutionContent = {
  opening: string
  steps: readonly [string, string, string]
  statement: string
  emphasis: string
  closing: string
}

export type SkreddersyVarmenPageContent = {
  seo: SkreddersyVarmenSeoContent
  hero: {
    headline: string
    accent: string
    leadFirst: string
    leadSecond: string
  }
  empathy: {
    scenes: readonly EmpathySceneContent[]
    resolution: EmpathyResolutionContent
  }
  threeInOne: {
    eyebrow: string
    heading: string
    introduction: string
    lastUpdated: string
    lastUpdatedLabel: string
    scenes: readonly ThreeModeSceneContent[]
  }
}

export function buildSkreddersyVarmenMetadata(
  seo: SkreddersyVarmenSeoContent
): Metadata {
  return {
    title: { absolute: seo.title },
    description: seo.description,
    category: 'Yttertøy',
    authors: [
      { name: 'Utekos', url: 'https://utekos.no/om-oss' }
    ],
    creator: 'Utekos',
    publisher: 'Utekos',
    alternates: { canonical: seo.canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        'index': true,
        'follow': true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1
      }
    },
    openGraph: {
      type: 'website',
      locale: 'no_NO',
      title: seo.socialTitle,
      description: seo.description,
      url: seo.canonical,
      siteName: 'Utekos',
      images: [seo.socialImage]
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.socialTitle,
      description: seo.description,
      images: [seo.socialImage]
    }
  }
}

const sceneContract = [
  { id: 'fullengde', transition: 'static' },
  { id: 'oppjustert', transition: 'vertical-curtain' },
  { id: 'parkas', transition: 'horizontal-door' }
] as const

function hasSceneCopy(
  value: unknown
): value is ThreeModeSceneContent {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.stepNumber === 'string' &&
    typeof candidate.modeName === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.imageAlt === 'string' &&
    typeof candidate.description === 'string'
  )
}

export function parseThreeModeScenes(
  value: readonly unknown[]
): readonly ThreeModeScene[] {
  const missingImageAlt = value.some(
    scene =>
      !!scene &&
      typeof scene === 'object' &&
      typeof (scene as Record<string, unknown>).imageAlt !==
        'string'
  )

  if (missingImageAlt) {
    throw new Error(
      'Hvert 3-i-1-bilde må ha redaksjonell alternativ tekst.'
    )
  }

  const matchesContract =
    value.length === sceneContract.length &&
    value.every(
      (scene, index) =>
        hasSceneCopy(scene) &&
        scene.id === sceneContract[index]?.id
    )

  if (!matchesContract) {
    throw new Error(
      '3-i-1-innholdet må inneholde fullengde, oppjustert og parkas i denne rekkefølgen.'
    )
  }

  return value.map((scene, index) => ({
    ...(scene as ThreeModeSceneContent),
    transition: sceneContract[index]!.transition
  }))
}

const requiredText = z.string().min(1)

const empathyTextSceneSchema = z
  .object({
    id: z.enum([
      'moment',
      'recognition',
      'bonfire-copy',
      'question'
    ]),
    kind: z.literal('text'),
    copy: requiredText
  })
  .strict()

const empathyMediaSceneSchema = z
  .object({
    id: z.enum(['bonfire', 'chill']),
    kind: z.literal('media'),
    copy: requiredText,
    imageSrc: z.enum([
      '/src/assets/images/techdown/SkreddersyVarmen-1.webp',
      '/src/assets/images/techdown/UtekosTechDownMElegense.webp'
    ]),
    imageAlt: requiredText
  })
  .strict()

const empathySceneSchema = z.discriminatedUnion('kind', [
  empathyTextSceneSchema,
  empathyMediaSceneSchema
])

const empathySceneContract = [
  { id: 'moment', kind: 'text' },
  { id: 'recognition', kind: 'text' },
  { id: 'bonfire-copy', kind: 'text' },
  {
    id: 'bonfire',
    kind: 'media',
    imageSrc:
      '/src/assets/images/techdown/SkreddersyVarmen-1.webp'
  },
  {
    id: 'chill',
    kind: 'media',
    imageSrc:
      '/src/assets/images/techdown/UtekosTechDownMElegense.webp'
  },
  { id: 'question', kind: 'text' }
] as const

export function parseEmpathyScenes(
  value: readonly unknown[]
): readonly EmpathySceneContent[] {
  const missingImageAlt = value.some(scene => {
    if (!scene || typeof scene !== 'object') return false

    const candidate = scene as Record<string, unknown>

    return (
      candidate.kind === 'media' &&
      (typeof candidate.imageAlt !== 'string' ||
        candidate.imageAlt.trim().length === 0)
    )
  })

  if (missingImageAlt) {
    throw new Error(
      'Hvert empati-bilde må ha redaksjonell alternativ tekst.'
    )
  }

  const parsed = z.array(empathySceneSchema).parse(value)
  const matchesContract =
    parsed.length === empathySceneContract.length &&
    parsed.every((scene, index) => {
      const expected = empathySceneContract[index]

      if (
        !expected ||
        scene.id !== expected.id ||
        scene.kind !== expected.kind
      ) {
        return false
      }

      if (scene.kind === 'text') return true

      return (
        'imageSrc' in expected &&
        scene.imageSrc === expected.imageSrc
      )
    })

  if (!matchesContract) {
    throw new Error(
      'Empati-innholdet må inneholde nøyaktig seks empatiscener i avtalt rekkefølge.'
    )
  }

  return parsed
}

const pageContentSchema = z.object({
  seo: z.object({
    title: requiredText,
    socialTitle: requiredText,
    description: requiredText,
    canonical: z.url(),
    socialImage: z.object({
      url: z.url(),
      width: z.number().positive(),
      height: z.number().positive(),
      type: requiredText,
      alt: requiredText
    })
  }),
  hero: z.object({
    headline: requiredText,
    accent: requiredText,
    leadFirst: requiredText,
    leadSecond: requiredText
  }),
  empathy: z.object({
    scenes: z.array(empathySceneSchema),
    resolution: z.object({
      opening: requiredText,
      steps: z.tuple([requiredText, requiredText, requiredText]),
      statement: requiredText,
      emphasis: requiredText,
      closing: requiredText
    })
  }),
  threeInOne: z.object({
    eyebrow: requiredText,
    heading: requiredText,
    introduction: requiredText,
    lastUpdated: requiredText,
    lastUpdatedLabel: requiredText,
    scenes: z.array(
      z.object({
        id: z.enum(['fullengde', 'oppjustert', 'parkas']),
        stepNumber: requiredText,
        modeName: requiredText,
        title: requiredText,
        imageAlt: requiredText,
        description: requiredText
      })
    )
  })
})

export function parseSkreddersyVarmenPageContent(
  value: unknown
): SkreddersyVarmenPageContent {
  const parsed = pageContentSchema.parse(value)
  const empathyScenes = parseEmpathyScenes(parsed.empathy.scenes)
  parseThreeModeScenes(parsed.threeInOne.scenes)

  return {
    ...parsed,
    empathy: { ...parsed.empathy, scenes: empathyScenes }
  }
}
