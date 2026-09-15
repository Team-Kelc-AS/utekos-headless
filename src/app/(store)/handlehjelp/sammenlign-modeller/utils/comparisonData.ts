import type { StaticImageData } from 'next/image'
import frontpageKateLinn from '@/assets/images/about/frontpage-kate-linn.webp'
import coffeUtekos from '@/assets/images/inspiration/coffe_utekos.webp'

export type ModelKey = 'utekos-dun' | 'utekos-mikrofiber' | 'utekos-techdown'

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
  imageSrc: string | StaticImageData
  imageAlt: string
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
    imageSrc: coffeUtekos,
    imageAlt: 'Utekos Dun brukt på hytten en kald og tørr kveld',
    badge: 'Mest varme per gram',
    bestFor: 'Tørre, kalde kvelder på hytten',
    description:
      'Velg Utekos Dun når du du primært søker varme. Denne modellen gir mest varme i forhold til vekt, og er godt  valg for tørre vinterkvelder. Varianten kan også benyttes som sovepose ved temperaturer ned mot 0 °C.',
    cta: 'Se Utekos Dun',
    proofPoints: ['650 fillpower', 'Høy varme-til-vekt forhold', 'Komprimeres godt']
  },
  {
    key: 'utekos-mikrofiber',
    name: 'Utekos Mikrofiber™',
    shortName: 'Mikrofiber™',
    href: '/produkter/utekos-mikrofiber',
    imageSrc: frontpageKateLinn,
    imageAlt: 'Utekos Mikrofiber brukt som lett komfortplagg ute',
    badge: 'Enklest i bruk',
    bestFor: 'Bobil, reise og daglig bruk',
    description:
      'Velg Utekos Mikrofiber når du vil ha et lett plagg som tørker raskt og er lett å pakke. Best egnet for de mer lune dagene og kveldene, eller hvis du planlegger å bruke Utekos i aktivitet. Et godt valg for bobil, reise og hverdagsbruk.',
    cta: 'Se Utekos Mikrofiber',
    proofPoints: ['Lavest vekt', 'Tørker raskt', 'Maskinvask']
  },
  {
    key: 'utekos-techdown',
    name: 'Utekos TechDown™',
    shortName: 'TechDown™',
    href: '/produkter/utekos-techdown',
    imageSrc: '/og-kate-linn-kikkert-master.png',
    imageAlt: 'Utekos TechDown brukt ved sjøen i norsk vær',
    badge: 'Mest allsidig',
    bestFor: 'Fleksibel - egner seg alle årstider.',
    description:
      'Velg TechDown hvis du vil ha det mest allsidige alternativet. Den holder varmer når du holder deg i ro, og lar seg justere etter behov ved aktivitet. Har egenskaper som gjør den egnet til bruk i både tørt og fuktig vær. ',
    cta: 'Se Utekos TechDown',
    proofPoints: ['CloudWeave™', 'Robust ytterstoff', 'Helårsbruk']
  }
]

export const comparisonRows: ComparisonRow[] = [
  {
    feature: 'Best for',
    shortAnswer: 'Brukssituasjon',
    values: {
      'utekos-dun': 'Hytte, terrasse og tørre vinterkvelder.',
      'utekos-mikrofiber': 'Bobil, reise, hverdagsbruk og turer med lav pakkevekt.',
      'utekos-techdown': 'Båt, kyst, camping og helårsbruk i norsk vær.'
    }
  },
  {
    feature: 'Varme i tørt vær',
    shortAnswer: 'Dun gir mest varme per gram.',
    values: {
      'utekos-dun': 'Svært høy varme i lav vekt.',
      'utekos-mikrofiber': 'God og jevn varme for de fleste dager.',
      'utekos-techdown': 'Høy varme med mer robust konstruksjon.'
    }
  },
  {
    feature: 'Varme i fuktig vær',
    shortAnswer: 'Syntetisk isolasjon tåler fukt best.',
    values: {
      'utekos-dun': 'God, men ekte dun krever mer omsorg hvis plagget blir vått.',
      'utekos-mikrofiber': 'Svært trygg i fukt fordi syntetisk fyll tørker raskt.',
      'utekos-techdown': 'Svært trygg i fukt med CloudWeave™-isolasjon.'
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
    shortAnswer: 'Mikrofiber og TechDown er enklest å vaske.',
    values: {
      'utekos-dun': 'Skånsom vask og god tørk bevarer spensten.',
      'utekos-mikrofiber': 'Maskinvask og rask tørk.',
      'utekos-techdown': 'Maskinvask og rask tørk.'
    }
  },
  {
    feature: 'Isolasjon',
    shortAnswer: 'Tre ulike isolasjonstyper.',
    values: {
      'utekos-dun': '90 % andedun, 650 FP.',
      'utekos-mikrofiber': 'Syntetisk mikrofiber.',
      'utekos-techdown': 'CloudWeave™, en dunlignende syntetisk isolasjon.'
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

export const deepDiveSections = [
  {
    eyebrow: 'Utekos Dun sammelignet med Utekos Mikrofiber',
    title: 'Velg Dun for tørr kulde og Mikrofiber for enkel bruk',
    body: 'Utekos Dun gir mest varme i forhold til vekt. Utekos Mikrofiber er lettere å bruke ofte fordi den tåler mer fukt, tørker raskt og er lett å pakke.',
    points: [
      'Dun passer best når været er tørt og kaldt.',
      'Mikrofiber passer best når plagget ofte pakkes, vaskes og tas med på tur.',
      'Begge gir lun komfort, men de løser ulike behov.'
    ]
  },
  {
    eyebrow: 'For bruk i båt',
    title: 'Velg TechDown når været skifter',
    body: 'Utekos TechDown er laget for fuktige kvelder, kystluft og mer variert bruk. Den gir trygg varme når vær, underlag og temperatur endrer seg raskt.',
    points: [
      'Best valg til båt og kyst.',
      'Trygg til bobil og camping når plagget brukes ofte ute.',
      'Mer robust følelse enn de letteste modellene.'
    ]
  },
  {
    eyebrow: 'Til hytte og bobil',
    title: 'Bruken din avgjør riktig modell',
    body: 'Start med hvor plagget skal ligge klart. På hytten er Dun ofte riktig. I bobilen er Mikrofiber lett å pakke. I båten gir TechDown mest ro.',
    points: [
      'Hytte: Dun når lav vekt og høy varme er viktigst.',
      'Bobil: Mikrofiber når pakking og vask skal være lett.',
      'Båt: TechDown når fukt og vind ofte er en del av kvelden.'
    ]
  }
]

export const faqItems = [
  {
    question: 'Hvilken Utekos er best?',
    answer:
      'Utekos TechDown er mest allsidig i norsk vær. Utekos Dun er varmest i forhold til vekt i tørt vær. Utekos Mikrofiber er lettest og enklest å pakke.'
  },
  {
    question: 'Hva er forskjellen på Utekos Dun og Utekos Mikrofiber?',
    answer:
      'Utekos Dun bruker ekte dun og gir mest varme per gram. Utekos Mikrofiber bruker syntetisk fyll, veier mindre, tørker raskere og er enklere å vaske ofte.'
  },
  {
    question: 'Hvilken Utekos passer best til bobil?',
    answer:
      'Utekos Mikrofiber passer svært godt til bobil fordi den er lett, pakkbar og rask å tørke. Velg TechDown hvis du ofte sitter ute i fuktig eller skiftende vær.'
  },
  {
    question: 'Hvilken Utekos passer best til båt?',
    answer:
      'Utekos TechDown passer best til båt fordi isolasjonen tåler fuktig kystluft og skiftende vær bedre.'
  }
]
