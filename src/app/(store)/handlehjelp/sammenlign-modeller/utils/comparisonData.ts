export type ModelKey =
  | 'utekos-dun'
  | 'utekos-mikrofiber'
  | 'utekos-techdown'

export type ComparisonRow = {
  feature: string
  shortAnswer: string
  values: Record<ModelKey, string | boolean>
}

export type ModelRecommendation = {
  key: ModelKey
  name: string
  shortName: string
  href: string
  badge: string
  bestFor: string
  description: string
  cta: string
  proofPoints: string[]
}

export const modelRecommendations: ModelRecommendation[] = [
  {
    key: 'utekos-dun',
    name: 'Utekos Dun™',
    shortName: 'Dun™',
    href: '/produkter/utekos-dun',
    badge: 'Dunisolasjon',
    bestFor: 'Tørre, kalde kvelder på hytten',
    description:
      'Utekos Dun™ har dunisolasjon med 650 fillpower. Vi anbefaler modellen når du ønsker dun til rolige, tørre kvelder. Dun krever omtanke ved vask og grundig tørking.',
    cta: 'Se Utekos Dun',
    proofPoints: [
      '650 fillpower',
      'Ca. 1000 g',
      'Justerbar hette og toveis glidelås'
    ]
  },
  {
    key: 'utekos-mikrofiber',
    name: 'Utekos Mikrofiber™',
    shortName: 'Mikrofiber™',
    href: '/produkter/utekos-mikrofiber',
    badge: 'Lavest oppgitt vekt',
    bestFor: 'Bobil, reise og daglig bruk',
    description:
      'Utekos Mikrofiber™ har syntetisk fyll og en oppgitt vekt på ca. 800 g. Vi anbefaler modellen når lav vekt, enkel pakking og vedlikehold er viktig, for eksempel på reise eller i bobil.',
    cta: 'Se Utekos Mikrofiber',
    proofPoints: [
      'Ca. 800 g',
      'Syntetisk mikrofiberisolasjon',
      'Maskinvask etter vaskeanvisningen'
    ]
  },
  {
    key: 'utekos-techdown',
    name: 'Utekos TechDown™',
    shortName: 'TechDown™',
    href: '/produkter/utekos-techdown',
    badge: 'CloudWeave™-isolasjon',
    bestFor: 'Skiftende vær og rolige stunder ute',
    description:
      'Utekos TechDown™ kombinerer syntetisk CloudWeave™-isolasjon med Luméa™-ytterstoff. Vi anbefaler modellen til variert utebruk når du ønsker justerbar tildekking og syntetisk isolasjon.',
    cta: 'Se Utekos TechDown',
    proofPoints: [
      'CloudWeave™-isolasjon',
      'Luméa™-ytterstoff',
      'Ca. 1300 g'
    ]
  }
]

export const comparisonRows: ComparisonRow[] = [
  {
    feature: 'Aktuelle bruksområder',
    shortAnswer: 'Brukssituasjon',
    values: {
      'utekos-dun': 'Hytte, terrasse og tørre vinterkvelder.',
      'utekos-mikrofiber':
        'Bobil, reise, hverdagsbruk og turer med lav pakkevekt.',
      'utekos-techdown':
        'Rolige stunder i båt, på camping og på terrassen. Tilpass bekledningen etter vær og aktivitet.'
    }
  },
  {
    feature: 'Tørre kvelder',
    shortAnswer: 'Veiledende bruksråd, ikke en temperaturtest.',
    values: {
      'utekos-dun': 'For deg som foretrekker dunisolasjon.',
      'utekos-mikrofiber':
        'For deg som prioriterer lav vekt og enkel pakking.',
      'utekos-techdown':
        'For deg som ønsker syntetisk isolasjon og justerbar tildekking.'
    }
  },
  {
    feature: 'Ved fukt og tørking',
    shortAnswer:
      'Følg alltid plaggets vaske- og tørkeanvisning.',
    values: {
      'utekos-dun':
        'Dun krever grundig tørking for å bevare spensten.',
      'utekos-mikrofiber':
        'Syntetisk fyll og hurtigtørkende materiale.',
      'utekos-techdown':
        'Syntetisk CloudWeave™-isolasjon, utviklet for variert utebruk.'
    }
  },
  {
    feature: 'Vekt ca.',
    shortAnswer: 'Mikrofiber er lettest.',
    values: {
      'utekos-dun': 'Ca. 1000 g.',
      'utekos-mikrofiber': 'Ca. 800 g.',
      'utekos-techdown': 'Ca. 1300 g.'
    }
  },
  {
    feature: 'Vedlikehold',
    shortAnswer: 'Følg vaskeanvisningen for hver modell.',
    values: {
      'utekos-dun': 'Skånsom vask og god tørk bevarer spensten.',
      'utekos-mikrofiber': 'Maskinvask og rask tørk.',
      'utekos-techdown': 'Maskinvask etter vaskeanvisningen.'
    }
  },
  {
    feature: 'Isolasjon',
    shortAnswer: 'Tre ulike isolasjonstyper.',
    values: {
      'utekos-dun': '90 % dun, 650 fillpower.',
      'utekos-mikrofiber': 'Syntetisk mikrofiber.',
      'utekos-techdown':
        'CloudWeave™, en dunlignende syntetisk isolasjon.'
    }
  },
  {
    feature: 'Isolert hette',
    shortAnswer: 'Alle tre har isolert hette.',
    values: {
      'utekos-dun': true,
      'utekos-mikrofiber': true,
      'utekos-techdown': true
    }
  }
]

export const faqItems = [
  {
    question: 'Hvilken Utekos er best?',
    answer:
      'Det avhenger av bruken. Vi anbefaler Utekos Dun™ hvis du foretrekker dunisolasjon til tørre kvelder, Utekos Mikrofiber™ når lav vekt og enkel pakking er viktig, og Utekos TechDown™ til variert utebruk med syntetisk CloudWeave™-isolasjon.'
  },
  {
    question:
      'Hva er forskjellen på Utekos Dun og Utekos Mikrofiber?',
    answer:
      'Utekos Dun™ har dunisolasjon med 650 fillpower og veier ca. 1000 g. Utekos Mikrofiber™ har syntetisk mikrofiberisolasjon og veier ca. 800 g. Dun og syntetisk fyll har ulike behov ved vask og tørking; følg anvisningen på plagget.'
  },
  {
    question: 'Hvilken Utekos passer best til bobil?',
    answer:
      'Vi anbefaler Utekos Mikrofiber™ når lav vekt og enkel pakking er viktig i bobilen. Utekos TechDown™ er et alternativ når du ønsker CloudWeave™-isolasjon til variert utebruk. Se også på plass, vedlikehold og passform.'
  },
  {
    question: 'Hvilken Utekos passer best til båt?',
    answer:
      'Vi anbefaler å vurdere Utekos TechDown™ til rolige stunder i båten, med syntetisk CloudWeave™-isolasjon og justerbar tildekking. Valget avhenger også av vær og aktivitet. Et varmt plagg erstatter ikke regntøy eller nødvendig sikkerhetsutstyr.'
  }
]
