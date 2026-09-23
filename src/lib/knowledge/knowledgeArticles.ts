import { SITE_URL } from '@/constants'

export type KnowledgeReference = {
  title: string
  attribution: string
  url?: string
  suffix?: string
}

export type KnowledgeArticle = {
  slug: string
  path: `/kunnskap/${string}`
  title: string
  metaTitle: string
  description: string
  articleSection: string
  publishedAt: string
  updatedAt: string
  topics: readonly string[]
  references: readonly KnowledgeReference[]
  referencesVisibleInBody?: boolean
}

export const knowledgeOverview = {
  path: '/kunnskap',
  title: 'Kunnskap om kulde, varme og isolasjon',
  metaTitle: 'Kunnskap om kulde, varme og isolasjon | Utekos',
  description:
    'Kildebaserte guider fra Utekos om kulde, varme, bekledning og isolasjon – skrevet for å gjøre det enklere å forstå hva som holder deg varm ute.',
  updatedAt: '2026-09-23T12:53:06+02:00'
} as const

const sharedDescription =
  'Mange tror at en tykk jakke i seg selv produserer varme. Sannheten er at det er du som er varmekilden – jakkens eneste jobb er å forhindre at denne varmen forsvinner ut i omgivelsene.'

const cloudWeaveReferences = [
  {
    title: 'Teknologi og materialer / Utekos TechDown™',
    attribution: 'Utekos (2024)',
    url: `${SITE_URL}/handlehjelp/teknologi-materialer`,
    suffix: '. Hentet fra utekos.no'
  },
  {
    title:
      'Syntetiske materialer - slik fungerer syntetisk fylling',
    attribution: 'Naturkompaniet (u.å.)',
    suffix: '. Hentet fra naturkompaniet.no'
  },
  {
    title: 'Tekstil – Naturfag (DT)',
    attribution: 'NDLA (2026)',
    suffix: '. Hentet fra ndla.no'
  },
  {
    title:
      'Hydrophobic down, the role of water resistant down filling in outdoor gear',
    attribution: 'Khibu Blog (2025)',
    suffix: '. Hentet fra khibu.hu'
  },
  {
    title: 'Heat loss through wet clothing insulation',
    attribution: 'Farnworth, B., & Dolhan, P.A. (1983)',
    suffix: '. Government of Canada Publications.'
  },
  {
    title:
      'Mikroplast fra tekstiler og veien mot en sirkulær økonomi',
    attribution: 'Forbruksforskningsinstituttet SIFO (u.å.)',
    suffix: '.'
  }
] as const satisfies readonly KnowledgeReference[]

export const knowledgeArticles = {
  cloudweave: {
    slug: 'cloudweave',
    path: '/kunnskap/cloudweave',
    title: 'CloudWeave™, dun og det norske klimaet',
    metaTitle: 'CloudWeave™, dun og det norske klimaet | Utekos',
    description: sharedDescription,
    articleSection: 'Materialer og isolasjon',
    publishedAt: '2026-09-23T12:53:06+02:00',
    updatedAt: '2026-09-23T12:53:06+02:00',
    topics: [
      'CloudWeave',
      'syntetisk isolasjon',
      'dun',
      'fukt',
      'Utekos TechDown'
    ],
    references: cloudWeaveReferences,
    referencesVisibleInBody: true
  },
  baseLayer: {
    slug: 'hva-skal-man-ha-innerst',
    path: '/kunnskap/hva-skal-man-ha-innerst',
    title:
      'En komplett guide til isolasjon: Forstå CloudWeave™, dun og det norske klimaet',
    metaTitle:
      'En komplett guide til isolasjon: CloudWeave™ og dun | Utekos',
    description: sharedDescription,
    articleSection: 'Materialer og isolasjon',
    publishedAt: '2026-09-23T12:22:40+02:00',
    updatedAt: '2026-09-23T12:22:40+02:00',
    topics: [
      'CloudWeave',
      'syntetisk isolasjon',
      'dun',
      'fukt',
      'Utekos TechDown'
    ],
    references: cloudWeaveReferences,
    referencesVisibleInBody: true
  },
  keepWarm: {
    slug: 'hvordan-holde-varmen-ute',
    path: '/kunnskap/hvordan-holde-varmen-ute',
    title: 'Hvordan holder man seg varm ute?',
    metaTitle: 'Hvordan holder man seg varm ute? | Utekos',
    description:
      'Vi nordmenn elsker å ferdes i naturen, uansett årstid. Utfordringen er den samme: Hvordan unngår vi å fryse?',
    articleSection: 'Kulde og varme',
    publishedAt: '2026-09-23T10:05:11+02:00',
    updatedAt: '2026-09-23T10:05:11+02:00',
    topics: [
      'holde varmen ute',
      'lag-på-lag',
      'vinterbekledning',
      'vind',
      'fukt'
    ],
    references: [
      {
        title:
          'Human physiological responses to cold exposure: Acute responses and acclimatization to prolonged exposure',
        attribution:
          'Castellani og Young, Autonomic Neuroscience (2016)',
        url: 'https://doi.org/10.1016/j.autneu.2016.02.009'
      },
      {
        title: 'Human Cold Stress',
        attribution: 'Ken Parsons, CRC Press (2022)',
        url: 'https://www.routledge.com/Human-Cold-Stress/Parsons/p/book/9780367552008'
      },
      {
        title:
          'Impact of wet underwear on thermoregulatory responses and thermal comfort in the cold',
        attribution: 'Bakkevig og Nielsen, Ergonomics (1994)',
        url: 'https://doi.org/10.1080/00140139408964916'
      },
      {
        title:
          'Clothing Physiological Properties of Cold Protective Clothing and Their Effects on Human Experience',
        attribution:
          'Kirsi Jussila, Tampere University of Technology (2016)',
        url: 'https://urn.fi/URN:ISBN:978-952-15-3708-0'
      },
      {
        title:
          'Responses of the hands and feet to cold exposure',
        attribution: 'Stephen S. Cheung, Temperature (2015)',
        url: 'https://doi.org/10.1080/23328940.2015.1008890'
      },
      {
        title:
          'Effects of wind and rain on thermal responses of humans in a mildly cold environment',
        attribution:
          'Yamane mfl., European Journal of Applied Physiology (2010)',
        url: 'https://doi.org/10.1007/s00421-010-1369-y'
      },
      {
        title:
          'ACSM Expert Consensus Statement: Injury Prevention and Exercise Performance during Cold-Weather Exercise',
        attribution:
          'Castellani mfl., Current Sports Medicine Reports (2021)',
        url: 'https://doi.org/10.1249/JSR.0000000000000907'
      },
      {
        title: 'Kunsten å bekjempe vinterkulda',
        attribution: 'Forsvarets forskningsinstitutt (2026)',
        url: 'https://www.ffi.no/aktuelt/feature-artikler/kunsten-a-bekjempe-vinterkulda'
      },
      {
        title: 'Slik kler du deg i kulde – fra topp til tå',
        attribution: 'SINTEF (2021)',
        url: 'https://www.sintef.no/siste-nytt/2021/slik-kler-du-deg-i-kulda-fra-topp-til-ta/'
      },
      {
        title:
          'Ergonomics of the thermal environment — Determination and interpretation of cold stress when using required clothing insulation (IREQ) and local cooling effects',
        attribution: 'ISO 11079:2007',
        url: 'https://www.iso.org/standard/38900.html'
      }
    ]
  },
  cold: {
    slug: 'hvorfor-blir-man-kald',
    path: '/kunnskap/hvorfor-blir-man-kald',
    title: 'Hvorfor blir man kald?',
    metaTitle: 'Hvorfor blir man kald? | Utekos',
    description:
      'Hvorfor blir man egentlig kald? Forstå kroppens termoregulering, mytene om varmetap, og lær forskernes definitive råd for å holde varmen på kalde dager.',
    articleSection: 'Kulde og varme',
    publishedAt: '2026-09-23T08:00:00+02:00',
    updatedAt: '2026-09-23T08:00:00+02:00',
    topics: [
      'kulde',
      'termoregulering',
      'varmetap',
      'bekledning',
      'fysiologi',
      'friluftsliv',
      'vinter',
      'kropp og helse'
    ],
    references: [
      {
        title:
          'Human physiological responses to cold exposure: Acute responses and acclimatization to prolonged exposure',
        attribution:
          'Castellani og Young, Autonomic Neuroscience (2016)',
        url: 'https://doi.org/10.1016/j.autneu.2016.02.009'
      }
    ]
  }
} as const satisfies Record<string, KnowledgeArticle>

export const knowledgeArticleList: readonly KnowledgeArticle[] =
  Object.values(knowledgeArticles)
