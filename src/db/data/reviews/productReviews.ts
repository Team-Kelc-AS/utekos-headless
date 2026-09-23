export type ProductReviewDate =
  | { type: 'exactDate'; datePublished: string }
  | {
      type: 'relativeAgeAtImport'
      observedOn: string
      months: number
    }

export type ProductReviewItem = {
  id: string
  author: string
  date: ProductReviewDate
  ratingValue: 1 | 2 | 3 | 4 | 5
  reviewBody: string
  verifiedPurchase?: boolean
  source?: 'judge-me'
}

export type ProductReviewBundle = {
  aggregateRating: {
    ratingValue: number
    reviewCount: number
    ratingCount: number
    bestRating: 1 | 2 | 3 | 4 | 5
    worstRating: 1 | 2 | 3 | 4 | 5
  }
  reviews: ProductReviewItem[]
}

export const techDownReviewBundle = {
  aggregateRating: {
    ratingValue: 4.93,
    reviewCount: 21,
    ratingCount: 21,
    bestRating: 5,
    worstRating: 4
  },
  reviews: [
    {
      id: 'techdown-edvin-ole-holstad-20260922',
      author: 'Edvin Ole Holstad',
      date: { type: 'exactDate', datePublished: '2026-09-22' },
      ratingValue: 5,
      reviewBody:
        'Fantastisk plagg. Mange som bestiller nå etter Camp Expo på Hellerudsletta.',
      verifiedPurchase: true,
      source: 'judge-me'
    },
    {
      id: 'techdown-steinar-rask-20260920',
      author: 'Steinar Rask',
      date: { type: 'exactDate', datePublished: '2026-09-20' },
      ratingValue: 5,
      reviewBody: 'Veldig bra produkt og ikke minst service.',
      verifiedPurchase: true,
      source: 'judge-me'
    },
    {
      id: 'techdown-lisa-holtermann-20260902',
      author: 'Lisa Holtermann',
      date: { type: 'exactDate', datePublished: '2026-09-02' },
      ratingValue: 5,
      reviewBody:
        'Veldig bra. Kjøpt stor, og den var varm, passe romslig og lang nok, jeg er 172 cm. Kan både gå med den, og lukkes nede ved bena når jeg sitter.',
      verifiedPurchase: true,
      source: 'judge-me'
    },
    {
      id: 'techdown-per-erik-skei-20260824',
      author: 'Per Erik Skei',
      date: { type: 'exactDate', datePublished: '2026-08-24' },
      ratingValue: 4,
      reviewBody:
        'Gave til fruen: Tilbakemeldingen var Meget bra og anbefalte at jeg og bestilte en til meg. Kommer til å bestille 1 stk til.',
      verifiedPurchase: true,
      source: 'judge-me'
    },
    {
      id: 'techdown-odd-bergesen-202607',
      author: 'Odd Bergesen',
      date: {
        type: 'relativeAgeAtImport',
        observedOn: '2026-09-23',
        months: 2
      },
      ratingValue: 5,
      reviewBody:
        'Fruen var veldig glad for gaven, og den passet perfekt og var veldig varm og god.',
      verifiedPurchase: true,
      source: 'judge-me'
    },
    {
      id: 'techdown-heidi-schlottmann-202607',
      author: 'Heidi Schlottmann',
      date: {
        type: 'relativeAgeAtImport',
        observedOn: '2026-09-23',
        months: 2
      },
      ratingValue: 5,
      reviewBody:
        'Super service og gleder meg til å bruke produktet. Virker å levere på kvalitet.',
      verifiedPurchase: true,
      source: 'judge-me'
    },
    {
      id: 'techdown-hakon-ingul-202605',
      author: 'Håkon Ingul',
      date: {
        type: 'relativeAgeAtImport',
        observedOn: '2026-09-23',
        months: 4
      },
      ratingValue: 5,
      reviewBody:
        'Veldig fint og bra produkt. Enkelt og rask levering.',
      verifiedPurchase: true,
      source: 'judge-me'
    },
    {
      id: 'techdown-kjetil-hodne-20260316',
      author: 'Kjetil Hodne',
      date: { type: 'exactDate', datePublished: '2026-03-16' },
      ratingValue: 5,
      reviewBody:
        'Veldig kjekk å ha på kalde kvelder, gjør at du ikke trenger å gå pga. at du fryser😊',
      verifiedPurchase: true,
      source: 'judge-me'
    },
    {
      id: 'techdown-monika-hansen-20260223',
      author: 'Monika Hansen',
      date: { type: 'exactDate', datePublished: '2026-02-23' },
      ratingValue: 5,
      reviewBody:
        'Den var utrolig deilig å ha på ute i sneborgen. Varm og god over hele kroppen.',
      verifiedPurchase: true,
      source: 'judge-me'
    },
    {
      id: 'techdown-a-20260209',
      author: 'A',
      date: { type: 'exactDate', datePublished: '2026-02-09' },
      ratingValue: 5,
      reviewBody:
        'Jeg kjøpte den til sønnen min som sitter i rullestolen og nå holder han seg godt og varmt 👍',
      verifiedPurchase: true,
      source: 'judge-me'
    },
    {
      id: 'techdown-raimond-20260129',
      author: 'Raimond',
      date: { type: 'exactDate', datePublished: '2026-01-29' },
      ratingValue: 5,
      reviewBody:
        'Enkelt å bestille, rask levering og flott produkt.',
      verifiedPurchase: true,
      source: 'judge-me'
    }
  ]
} satisfies ProductReviewBundle

const microfibreReviewBundle = {
  aggregateRating: {
    ratingValue: 5,
    reviewCount: 4,
    ratingCount: 4,
    bestRating: 5,
    worstRating: 4
  },
  reviews: [
    {
      id: 'mikrofiber-gunnar-lie-eide-20260405',
      author: 'Gunnar Lie Eide',
      date: { type: 'exactDate', datePublished: '2026-04-05' },
      ratingValue: 5,
      reviewBody:
        'Utekos er prøvd på altan i sur nordaustavind og 4 grader. Den svarte til forventningene. Lurt å lære seg rett bruk av snøring. Den holdt meg varm og god. 🤩'
    },
    {
      id: 'mikrofiber-orjan-20260228',
      author: 'Ørjan',
      date: { type: 'exactDate', datePublished: '2026-02-28' },
      ratingValue: 5,
      reviewBody:
        'Veldig behagelig på. Veldig hyggelig og hjelpsom betjening som stilte opp med varene under 24 timer etter bestilling.'
    },
    {
      id: 'mikrofiber-carina-johansen-20260124',
      author: 'Carina Johansen',
      date: { type: 'exactDate', datePublished: '2026-01-24' },
      ratingValue: 5,
      reviewBody: 'Fantastisk 😊'
    },
    {
      id: 'mikrofiber-synnove-knappen-20260106',
      author: 'Synnøve Knappen',
      date: { type: 'exactDate', datePublished: '2026-01-06' },
      ratingValue: 5,
      reviewBody: 'Super utekosdress 🤩'
    }
  ]
} satisfies ProductReviewBundle

export const productReviewBundles: Record<
  string,
  ProductReviewBundle
> = {
  'utekos-techdown': techDownReviewBundle,
  'utekos-mikrofiber': microfibreReviewBundle
}
