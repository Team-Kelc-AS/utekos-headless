import type { Metadata } from 'next'
import type { ArticleTocEntry } from '@/components/articles/ArticleTableOfContents'
import type { ArticleReference } from '@/components/articles/ArticleReferences'
import { SITE_URL } from '@/constants'
import { technicalReferences } from './technicalReferences'

type ComparisonArticle = {
  title: string
  metaTitle: string
  description: string
  intro: string
  path: `/handlehjelp/${string}`
  category: string
  author: { name: string; url: string }
  publisher: { name: string; id: string }
  image: {
    src: string
    alt: string
    width: number
    height: number
  }
  topics: readonly string[]
  learnings: readonly string[]
  toc: readonly ArticleTocEntry[]
  references: readonly ArticleReference[]
}

// Dates are intentionally absent: migration is not evidence of publication.
export const comparisonArticle = {
  title: 'Hvilken Utekos passer best for deg?',
  metaTitle: 'Hvilken Utekos passer best for deg?',
  description:
    'Finn riktig Utekos for hytte, bobil, båt og norsk vær. Se forskjellen på Utekos Dun, Utekos Mikrofiber og Utekos TechDown.',
  intro:
    'Sammenlign Utekos Dun™, Utekos Mikrofiber™ og Utekos TechDown™. Start med hvordan du skal bruke plagget: varme på tørre kvelder, lav vekt på reisen eller komfort i skiftende vær.',
  path: '/handlehjelp/sammenlign-modeller',
  category: 'Kjøpsguide',
  author: {
    name: 'Utekos / KELC AS',
    url: `${SITE_URL}/om-oss`
  },
  publisher: {
    name: 'Utekos / KELC AS',
    id: `${SITE_URL}/#organization`
  },
  image: {
    src: '/hengekoye.jpg',
    alt: 'To personer i blå Utekos-plagg slapper av i en hengekøye i skogen',
    width: 1731,
    height: 1155
  },
  topics: [
    'Utekos Dun',
    'Utekos Mikrofiber',
    'Utekos TechDown',
    'Isolasjon',
    'Vekt',
    'Vedlikehold'
  ],
  learnings: [
    'Sammenlign isolasjon, vekt og vedlikehold før du velger.',
    'Ta utgangspunkt i været, aktiviteten og hva du skal pakke med deg.',
    'Les produktopplysninger og faglige kilder med deres respektive forbehold.'
  ],
  toc: [
    {
      id: 'velg-etter-bruk',
      label: 'Finn modellen din',
      description:
        'Start med hva som er viktigst for deg: varme, vekt eller allsidighet.'
    },
    {
      id: 'sammenligning',
      label: 'Sammenlign modellene',
      description:
        'Åpne hver modell og se spesifikasjoner og egenskaper samlet.'
    },
    {
      id: 'faglig-grunnlag',
      label: 'Varme, fukt og materialvalg',
      description:
        'Forstå målingene, forskningen og hva kildene faktisk beskriver.'
    },
    {
      id: 'sammenlign-modeller-deep-dive-heading',
      label: 'Velg etter bruksområde',
      description:
        'Vurder behovene dine på hytta, i bobilen, i båten og hjemme.'
    },
    {
      id: 'vanlige-sporsmal',
      label: 'Vanlige spørsmål',
      description:
        'Få korte svar på spørsmål om modellene og forskjellene.'
    },
    {
      id: 'comparison-next-step-title',
      label: 'Finn størrelser og få hjelp',
      description:
        'Gå til produktene eller spør oss om råd før du bestiller.'
    },
    {
      id: 'kilder',
      label: 'Kilder og faglitteratur',
      description:
        'Se referansene og hvilket grunnlag de gir for innholdet.'
    }
  ],
  references: technicalReferences
} as const satisfies ComparisonArticle

export function buildComparisonMetadata(): Metadata {
  const article = comparisonArticle
  const url = `${SITE_URL}${article.path}`
  return {
    title: article.metaTitle,
    description: article.description,
    authors: [
      { name: article.author.name, url: article.author.url }
    ],
    publisher: article.publisher.name,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      locale: 'nb_NO',
      title: article.metaTitle,
      description: article.description,
      url,
      siteName: 'Utekos',
      authors: [article.author.url],
      section: article.category,
      tags: [...article.topics],
      images: [
        {
          url: article.image.src,
          width: article.image.width,
          height: article.image.height,
          alt: article.image.alt
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: article.metaTitle,
      description: article.description,
      images: [article.image.src]
    }
  }
}
