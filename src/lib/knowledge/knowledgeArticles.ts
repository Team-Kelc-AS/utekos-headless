import { SITE_URL } from '@/constants'

export type KnowledgeReference = {
  title: string
  attribution: string
  url?: string
  suffix?: string
}

export type KnowledgeTocEntry = {
  id: string
  label: string
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
  readingMinutes: number
  topics: readonly string[]
  learnings: readonly string[]
  toc: readonly KnowledgeTocEntry[]
  references: readonly KnowledgeReference[]
  /**
   * Reserved for the planned AI summarizer. Short machine-generated
   * précis shown under the ingress once implemented.
   */
  summary?: string
}

export const knowledgeOverview = {
  path: '/kunnskap',
  title: 'Kunnskap om kulde, varme og isolasjon',
  metaTitle: 'Kunnskap om kulde, varme og isolasjon | Utekos',
  description:
    'Kildebaserte guider fra Utekos om kulde, varme, bekledning og isolasjon – skrevet for å gjøre det enklere å forstå hva som holder deg varm ute.',
  updatedAt: '2026-09-24T09:30:00+02:00'
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
    url: 'https://www.naturkompaniet.no/kunnskap/materialer/syntetiske-materialer/',
    suffix: '. Hentet fra naturkompaniet.no'
  },
  {
    title: 'Tekstil – Naturfag (DT)',
    attribution: 'NDLA (2026)',
    url: 'https://ndla.no/r/naturfag-dt/tekstil/e8df15ed3f',
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
    url: 'https://apps.dtic.mil/sti/tr/pdf/ADA136654.pdf',
    suffix: '. Defence Research Establishment Ottawa.'
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
    updatedAt: '2026-09-24T09:30:00+02:00',
    readingMinutes: 9,
    topics: [
      'CloudWeave',
      'syntetisk isolasjon',
      'dun',
      'fukt',
      'Utekos TechDown'
    ],
    learnings: [
      'De grunnleggende fysiske prinsippene bak hvordan klær holder deg varm.',
      'Forskjellene på tradisjonelt dun og moderne syntetisk isolasjon.',
      'Hvordan fuktighet påvirker kroppens varmetap og isolasjonsmaterialets yteevne.',
      'Hvorfor det norske klimaet stiller unike krav til yttertøyet ditt.',
      'Teknologien og konstruksjonen bak CloudWeave™ og Utekos TechDown™.'
    ],
    toc: [
      { id: 'hva-er-cloudweave', label: 'Hva er CloudWeave™?' },
      {
        id: 'hvordan-fungerer-isolasjon',
        label: 'Hvordan fungerer isolasjon?'
      },
      { id: 'cloudweave-vs-dun', label: 'CloudWeave vs. dun' },
      { id: 'hva-skjer-ved-fukt', label: 'Hva skjer ved fukt?' },
      { id: 'norsk-klima-og-bruk', label: 'Norsk klima og bruk' },
      {
        id: 'når-er-dun-et-godt-valg',
        label: 'Når er dun et godt valg?'
      },
      { id: 'cloudweave-i-techdown', label: 'CloudWeave i TechDown' },
      {
        id: 'hva-forskningen-ikke-kan-si-sikkert',
        label: 'Hva forskningen ikke kan si sikkert'
      },
      { id: 'oppsummering', label: 'Oppsummering' }
    ],
    references: cloudWeaveReferences
  },
  baseLayer: {
    slug: 'hva-skal-man-ha-innerst',
    path: '/kunnskap/hva-skal-man-ha-innerst',
    title: 'Hva skal man ha innerst når det er kaldt?',
    metaTitle: 'Hva skal man ha innerst? Ull vs. syntetisk | Utekos',
    description:
      'Ull eller syntetisk innerst? Lær hvordan innerlaget regulerer temperatur og fuktighet, hvorfor bomull er farlig i kulda, og hva du bør velge etter aktivitet.',
    articleSection: 'Materialer og isolasjon',
    publishedAt: '2026-09-23T12:22:40+02:00',
    updatedAt: '2026-09-24T09:30:00+02:00',
    readingMinutes: 12,
    topics: [
      'innerlag',
      'ull',
      'syntetisk undertøy',
      'bomull',
      'fukttransport',
      'lag-på-lag'
    ],
    learnings: [
      'Hvordan riktig innerlag regulerer kroppstemperaturen og transporterer fuktighet vekk fra huden.',
      'Forskjellen på ull og syntetiske materialer, og i hvilke situasjoner hvert av dem fungerer best.',
      'Hvorfor bomull aldri bør benyttes som innerlag i kaldt vær.',
      'Hvordan aktivitet, passform og fuktighet endrer kroppens evne til å holde på varmen.'
    ],
    toc: [
      { id: 'kort-svar-først', label: 'Kort svar først' },
      {
        id: 'hva-skal-innerlaget-egentlig-gjøre',
        label: 'Hva skal innerlaget egentlig gjøre?'
      },
      { id: 'ull-som-innerlag', label: 'Ull som innerlag' },
      { id: 'syntetisk-som-innerlag', label: 'Syntetisk som innerlag' },
      { id: 'hva-med-bomull', label: 'Hva med bomull?' },
      {
        id: 'aktivitet-vs-stillesitting',
        label: 'Aktivitet vs. stillesitting'
      },
      {
        id: 'hva-skjer-når-innerlaget-blir-fuktig',
        label: 'Hva skjer når innerlaget blir fuktig?'
      },
      {
        id: 'passform-tykkelse-og-konstruksjon',
        label: 'Passform, tykkelse og konstruksjon'
      },
      {
        id: 'praktisk-anbefaling-etter-brukssituasjon',
        label: 'Praktisk anbefaling etter brukssituasjon'
      },
      {
        id: 'hva-forskningen-ikke-kan-si-sikkert',
        label: 'Hva forskningen ikke kan si sikkert'
      },
      { id: 'oppsummering', label: 'Oppsummering' }
    ],
    references: [
      {
        title:
          'Effekten av bekledning på termisk komfort ved ulike aktivitetsnivåer',
        attribution: 'Abedin & DenHartog (2023/24)'
      },
      {
        title:
          'Impact of wet underwear on thermoregulatory responses and thermal comfort in the cold',
        attribution: 'Bakkevig og Nielsen, Ergonomics (1994)',
        url: 'https://doi.org/10.1080/00140139408964916'
      },
      {
        title:
          'Human physiological responses to cold exposure: Acute responses and acclimatization to prolonged exposure',
        attribution: 'Castellani og Young, Autonomic Neuroscience (2016)',
        url: 'https://doi.org/10.1016/j.autneu.2016.02.009'
      },
      {
        title:
          'Termisk regulering og bekledning ved fysisk aktivitet i kulde',
        attribution: 'Cernych mfl. (2017)'
      },
      {
        title:
          'Fukttransport i tekstiler: målemetoder og materialforskjeller',
        attribution: 'Ha mfl. (1996)'
      },
      {
        title:
          'Clothing Physiological Properties of Cold Protective Clothing and Their Effects on Human Experience',
        attribution: 'Kirsi Jussila, Tampere University of Technology (2016)',
        url: 'https://urn.fi/URN:ISBN:978-952-15-3708-0'
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
      }
    ]
  },
  keepWarm: {
    slug: 'hvordan-holde-varmen-ute',
    path: '/kunnskap/hvordan-holde-varmen-ute',
    title: 'Hvordan holder man seg varm ute?',
    metaTitle: 'Hvordan holder man seg varm ute? | Utekos',
    description:
      'Å holde varmen ute er et varmeregnskap: kroppen produserer varme, klærne hindrer at den forsvinner. Lær hvordan aktivitet, lag-på-lag, vind og fukt endrer regnestykket.',
    articleSection: 'Kulde og varme',
    publishedAt: '2026-09-23T10:05:11+02:00',
    updatedAt: '2026-09-24T09:30:00+02:00',
    readingMinutes: 17,
    topics: [
      'holde varmen ute',
      'lag-på-lag',
      'vinterbekledning',
      'vind',
      'fukt'
    ],
    learnings: [
      'Kroppens varmeregnskap: hvordan varmeproduksjon og varmetap (konveksjon, konduksjon, stråling og fordampning) avgjør om du fryser.',
      'Aktivitet mot stillesitting: hvorfor du skal starte småkald, og hvordan svette og pauser endrer isolasjonsbehovet.',
      'Lag på lag: innerlag for fukttransport, mellomlag for stillestående luft og ytterlag mot vind og nedbør.',
      'Vind og fukt: hvorfor vindavkjøling og våte klær stjeler varme – og hvordan du beskytter deg.',
      'Hender og føtter: hvorfor fingre og tær blir kalde først, og hvordan du får varmen tilbake.'
    ],
    toc: [
      {
        id: 'hva-bestemmer-om-du-holder-varmen',
        label: 'Hva bestemmer om du holder varmen?'
      },
      {
        id: 'aktivitet-kontra-stillesitting',
        label: 'Aktivitet kontra stillesitting'
      },
      { id: 'hva-bør-man-ha-innerst', label: 'Hva bør man ha innerst?' },
      {
        id: 'hva-skal-isolasjonslaget-gjøre',
        label: 'Hva skal isolasjonslaget gjøre?'
      },
      { id: 'hva-bør-man-ha-ytterst', label: 'Hva bør man ha ytterst?' },
      { id: 'hvor-mye-betyr-vinden', label: 'Hvor mye betyr vinden?' },
      { id: 'hva-når-det-regner', label: 'Hva når det regner?' },
      { id: 'hender-og-føtter', label: 'Hender og føtter' },
      {
        id: 'når-kulde-går-fra-ubehag-til-risiko',
        label: 'Når kulde går fra ubehag til risiko'
      },
      {
        id: 'hva-forskningen-ikke-kan-si-sikkert',
        label: 'Hva forskningen ikke kan si sikkert'
      },
      { id: 'oppsummering', label: 'Oppsummering' }
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
      'Å fryse er ikke kulde som kryper inn. Kroppen produserer varme, og omgivelsene tar den. Forstå termoregulering, mytene om varmetap, og hva som faktisk tipper balansen.',
    articleSection: 'Kulde og varme',
    publishedAt: '2026-09-23T08:00:00+02:00',
    updatedAt: '2026-09-24T09:30:00+02:00',
    readingMinutes: 18,
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
    learnings: [
      'Kroppens varmebalanse: samspillet mellom indre varmeproduksjon og varmeavgivelse til omgivelsene.',
      'Forskjellen på å kjenne seg kald på huden og å utvikle farlig nedkjøling av kjernetemperaturen.',
      'Derfor fryser du på hendene: vasokonstriksjon prioriterer varme til de vitale organene.',
      'Miljøfaktorenes rolle: hvorfor vind, fuktighet og kontakt med kalde overflater betyr like mye som lufttemperaturen.'
    ],
    toc: [
      {
        id: 'balansen-mellom-varmeproduksjon-og-varmeavgivelse',
        label: 'Balansen mellom varmeproduksjon og varmeavgivelse'
      },
      {
        id: 'termoregulering-slik-forsvarer-kroppen-seg',
        label: 'Termoregulering: Slik forsvarer kroppen seg'
      },
      {
        id: 'tre-forskjellige-opplevelser-av-kulde',
        label: 'Tre forskjellige opplevelser av kulde'
      },
      {
        id: 'hvorfor-fryser-noen-mer-enn-andre',
        label: 'Hvorfor fryser noen mer enn andre?'
      },
      {
        id: 'myter-farer-og-helseeffekter-av-kulde',
        label: 'Myter, farer og helseeffekter av kulde'
      },
      {
        id: 'slik-løser-du-problemet',
        label: 'Slik løser du problemet'
      },
      {
        id: 'hva-forskningen-ikke-kan-si-sikkert',
        label: 'Hva forskningen ikke kan si sikkert'
      },
      { id: 'oppsummering', label: 'Oppsummering' }
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
        title: 'Responses of the hands and feet to cold exposure',
        attribution: 'Stephen S. Cheung, Temperature (2015)',
        url: 'https://doi.org/10.1080/23328940.2015.1008890'
      },
      {
        title: 'Human Cold Stress',
        attribution: 'Ken Parsons, CRC Press (2022)',
        url: 'https://www.routledge.com/Human-Cold-Stress/Parsons/p/book/9780367552008'
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
          'ACSM Expert Consensus Statement: Injury Prevention and Exercise Performance during Cold-Weather Exercise',
        attribution:
          'Castellani mfl., Current Sports Medicine Reports (2021)',
        url: 'https://doi.org/10.1249/JSR.0000000000000907'
      },
      {
        title:
          'Ergonomics of the thermal environment — Determination and interpretation of cold stress when using required clothing insulation (IREQ) and local cooling effects',
        attribution: 'ISO 11079:2007',
        url: 'https://www.iso.org/standard/38900.html'
      }
    ]
  },
  ykk: {
    slug: 'ykk',
    path: '/kunnskap/ykk',
    title: 'Slik fungerer glidelåsen – mekanikk, kvalitet og vedlikehold',
    metaTitle: 'Slik fungerer glidelåsen – mekanikk og vedlikehold | Utekos',
    description:
      'Glidelåsen er det mest belastede mekaniske punktet i vintertøyet. Forstå hvordan glider, tenner og bånd samhandler, hvorfor glidelåsen svikter i kulde, og hvordan riktig vask og vedlikehold forlenger levetiden.',
    articleSection: 'Materialer og isolasjon',
    publishedAt: '2026-09-24T08:00:00+02:00',
    updatedAt: '2026-09-24T08:00:00+02:00',
    readingMinutes: 11,
    topics: [
      'glidelås',
      'YKK',
      'vedlikehold',
      'kvalitet',
      'bærekraft',
      'vintertøy'
    ],
    learnings: [
      'Hvordan glider, tenner og bånd samhandler – og hvorfor toleranser ned til 0,01 millimeter avgjør om glidelåsen holder.',
      'Hvorfor kulde, smuss og feil vask får glidelåsen til å kile seg eller dele seg – og hvordan du forebygger det.',
      'Hva standardiserte styrketester (tverrstyrke, stopperhold og kryssende trekk) faktisk måler.',
      'Hvordan du vasker, tørker og vedlikeholder glidelåser slik at de varer lenger.',
      'Hva kjemikalielister, sertifiseringer og revisjoner betyr for et lite mekanisk produkt.'
    ],
    toc: [
      { id: 'kort-svar-først', label: 'Kort svar først' },
      { id: 'slik-er-glidelåsen-bygd', label: 'Slik er glidelåsen bygd' },
      {
        id: 'derfor-åpner-eller-kiler-glidelåsen-seg',
        label: 'Derfor åpner eller kiler glidelåsen seg'
      },
      {
        id: 'friksjon-plast-og-datasimulering',
        label: 'Friksjon, plast og datasimulering'
      },
      { id: 'slik-testes-styrken', label: 'Slik testes styrken' },
      { id: 'vedlikehold-og-vask', label: 'Vedlikehold og vask' },
      {
        id: 'bærekraft-og-kjemikalier',
        label: 'Bærekraft og kjemikalier'
      },
      {
        id: 'menneskerettigheter-og-etisk-produksjon',
        label: 'Menneskerettigheter og etisk produksjon'
      },
      {
        id: 'hva-forskningen-ikke-kan-si-sikkert',
        label: 'Hva forskningen ikke kan si sikkert'
      },
      { id: 'oppsummering', label: 'Oppsummering' }
    ],
    references: [
      {
        title: "To begin with, what's the structure of a zipper?",
        attribution: 'YKK (u.å.)',
        url: 'https://www.ykk.com/english/ykk/tech/01.html',
        suffix: '. Hentet fra ykk.com'
      },
      {
        title: 'Amazing molds are the key to slider construction',
        attribution: 'YKK (u.å.)',
        url: 'https://www.ykk.com/english/ykk/tech/04.html',
        suffix: '. Hentet fra ykk.com'
      },
      {
        title: "Why zippers don't come open on their own",
        attribution: 'YKK (u.å.)',
        url: 'https://www.ykk.com/english/ykk/tech/03.html',
        suffix: '. Hentet fra ykk.com'
      },
      {
        title:
          'Our zippers share the same quality worldwide, due to integrated production',
        attribution: 'YKK (u.å.)',
        url: 'https://www.ykk.com/english/ykk/tech/02.html',
        suffix: '. Hentet fra ykk.com'
      },
      {
        title: 'Proper use of zippers and proper laundry procedure',
        attribution: 'YKK (u.å.)',
        url: 'https://www.ykk.com/english/ykk/tech/use.html',
        suffix: '. Hentet fra ykk.com'
      },
      {
        title:
          'Multiscale modeling and finite element analysis of PET zippers',
        attribution: 'Zou mfl., Results in Engineering (2026)',
        suffix: '. Vol. 32, 111748.'
      },
      {
        title: 'Sustainability Vision 2050 og kvalitetsstyring',
        attribution: 'YKK Group, data FY2024/FY2025',
        suffix: '. Hentet fra ykk.com'
      },
      {
        title: 'Strength standards for slide fasteners',
        attribution: 'JIS S2015:2019',
        suffix: '. Japanese Industrial Standard.'
      }
    ]
  }
} as const satisfies Record<string, KnowledgeArticle>

export const knowledgeArticleList: readonly KnowledgeArticle[] =
  Object.values(knowledgeArticles)
