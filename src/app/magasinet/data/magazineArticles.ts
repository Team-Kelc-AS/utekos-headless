import type { MagazineArticleInput } from '../types'
import erlingMesse from '@/assets/images/about/erling-messe.webp'
import kateErlingGressVann from '@/assets/images/about/kate-erling-gress-vann.webp'
import balpanneSteinheller from '@/assets/images/magazine/balpanne-steinheller.png'
import bat2 from '@/assets/images/magazine/bat.png'
import denUltimateHyggen from '@/assets/images/magazine/den-ultimate-hyggen.webp'
import lagdeltLys from '@/assets/images/magazine/lagdelt-lys.png'
import medUtekos from '@/assets/images/magazine/med-utekos.png'
import prikkenOverIen from '@/assets/images/magazine/prikken-over-ien.png'
import takrenne2 from '@/assets/images/magazine/takrenne.png'
import utekosSaueskinn from '@/assets/images/magazine/utekos-saueskinn.png'
import vintercamp2 from '@/assets/images/magazine/vintercamp.png'
import techdown1600x1000 from '@/assets/images/techdown/TechDown-1600x1000.webp'
import techdown1080 from '@/assets/images/techdown/techdown-1080.png'


export const rawMagazineArticles = [
  {
    slug: 'beredskap-egenomsorg',
    title: 'Beredskapsuken 2025: Hvordan Utekos oppgraderer din egenberedskap',
    excerpt: 'Ditt ess i ermet for å bevare tryggheten og varmen.',
    category: 'Tips og råd',
    publishedAt: '2025-10-30T00:00:00+01:00',
    updatedAt: '2025-10-30T00:00:00+01:00',
    readingTimeMinutes: 7,
    author: { name: 'Utekos' },
    heroImage: {
      src: medUtekos,
      alt: 'Utekos i en beredskapssituasjon med varme og trygghet i fokus',
      width: 1600,
      height: 1000,
      caption: 'Egenberedskap handler også om ro, varme og klær som virker når hverdagen stopper opp.'
    },
    seo: {
      title: 'Beredskapsuken 2025: Utekos og egenberedskap | Utekos Magasinet',
      description:
        'Slik kan personlig varme, riktig pakking og enkle rutiner gjøre egenberedskapen mer praktisk og trygg.'
    },
    theme: { accent: 'primary', surface: 'light' },
    relatedSlugs: [
      'vinterklargjoring-av-hytta-en-sjekkliste-for-livsnyteren',
      'den-ultimate-guiden-til-komfortabel-vintercamping',
      'hva-er-utekos'
    ],
    blocks: [
      {
        type: 'lead',
        text: 'Egenberedskap blir ofte omtalt som vann, batterier og tørrmat. Det er riktig, men ufullstendig. Når strømmen går, temperaturen faller eller du må vente lenge, er personlig varme en del av tryggheten.'
      },
      {
        type: 'paragraph',
        text: 'Utekos er ikke en erstatning for offentlige beredskapsråd. Det er et praktisk tillegg for kroppen. Et varmt plagg som ligger klart, er lett å dele, lett å ta på og enkelt å bruke uten strøm.'
      },
      {
        type: 'featureGrid',
        title: 'Tre roller i en enkel beredskapspakke',
        intro:
          'Målet er å gjøre komfort lett å hente frem når situasjonen krever mindre stress og mer kontroll.',
        items: [
          {
            title: 'Personlig varme',
            text: 'Hold overkropp og hender varme uten å varme opp hele rommet.',
            icon: 'thermometer'
          },
          {
            title: 'Lav terskel',
            text: 'Plagget kan brukes inne, ute, i bilen, på hytten eller mens du venter.',
            icon: 'shield'
          },
          {
            title: 'Delbar trygghet',
            text: 'Et romslig plagg kan raskt flyttes til den som fryser mest.',
            icon: 'heart'
          }
        ]
      },
      {
        type: 'image',
        src: denUltimateHyggen,
        alt: 'Lykt, pledd og Utekos som del av en rolig beredskapssone',
        width: 1536,
        height: 1024,
        caption: 'Legg varme, lys og enkel mat samme sted. Da slipper du å lete når du trenger det.'
      },
      {
        type: 'heading',
        level: 2,
        text: 'Slik pakker du for varme'
      },
      {
        type: 'stepList',
        steps: [
          {
            title: 'Velg et fast sted',
            text: 'Oppbevar Utekos sammen med lykt, lader, fyrstikker og førstehjelp.'
          },
          {
            title: 'Komprimer volumet',
            text: 'Bruk Stapper når plassen er knapp i bil, bobil, båt eller hyttebod.'
          },
          {
            title: 'Test før du trenger det',
            text: 'Ta plagget frem en kald kveld og se hvor raskt kroppen finner ro.'
          }
        ]
      },
      {
        type: 'callout',
        tone: 'commerce',
        title: 'Den beste beredskapen er enkel å bruke',
        text: 'Klær som ligger langt unna, er ofte klær som ikke blir brukt. Legg varme der du faktisk oppholder deg.'
      },
      {
        type: 'cta',
        title: 'Bygg en varm beredskapspakke',
        text: 'Start med et plagg som gir umiddelbar kroppsnær varme og et pakkesystem som gjør det lett å ta med.',
        primary: {
          href: '/produkter',
          label: 'Se produktene',
          trackingId: 'BeredskapEgenomsorgArticleAllProductsClick'
        },
        secondary: {
          href: '/produkter/utekos-stapper',
          label: 'Se Stapper',
          trackingId: 'BeredskapEgenomsorgArticleStapperClick'
        }
      }
    ]
  },
  {
    slug: 'utekos-techdown-lansering',
    title: 'Redefinerer personlig komfort.',
    excerpt: 'Oppdag en smartere måte å holde deg komfortabel utendørs på, slik at du kan forlenge favorittstundene dine.',
    category: 'Tips og råd',
    publishedAt: '2025-10-27T00:00:00+01:00',
    updatedAt: '2025-10-27T00:00:00+01:00',
    readingTimeMinutes: 8,
    author: { name: 'Utekos' },
    heroImage: {
      src: techdown1600x1000,
      alt: 'Utekos TechDown brukt ute i mykt nordisk lys',
      width: 1600,
      height: 1000,
      caption: 'TechDown™ er laget for varme, letthet og mer trygghet når været skifter.'
    },
    seo: {
      title: 'Utekos TechDown™ lansering | Utekos Magasinet',
      description:
        'Møt TechDown™, Utekos-plagget som kombinerer dunlignende letthet med syntetisk isolasjon for norsk utekomfort.'
    },
    theme: { accent: 'very-peri', surface: 'dark' },
    relatedSlugs: [
      'hva-er-utekos',
      '5-enkle-tips-for-a-forlenge-terrassesongen',
      'varm-og-klar-for-batpussen'
    ],
    blocks: [
      {
        type: 'lead',
        text: 'TechDown™ er laget for samme mål som resten av Utekos: å forlenge de gode stundene ute. Forskjellen ligger i materialvalget, passformen og tryggheten når været ikke holder seg tørt og stabilt.'
      },
      {
        type: 'paragraph',
        text: 'Et nordisk komfortplagg må tåle mer enn en pen kveld på terrassen. Det må være lett nok til å brukes ofte, varmt nok til å merkes og praktisk nok til at det blir med i bilen, båten og på hytten.'
      },
      {
        type: 'featureGrid',
        title: 'Hva TechDown™ gjør annerledes',
        items: [
          {
            title: 'Syntetisk isolasjon',
            text: 'CloudWave™ Insulation gir luftig varme og bedre trygghet når fuktighet er en del av bildet.',
            icon: 'layers'
          },
          {
            title: 'Lett hverdagsbruk',
            text: 'Plagget er laget for å bli valgt ofte, ikke bare når været er ekstremt.',
            icon: 'feather'
          },
          {
            title: '3-i-1-funksjon',
            text: 'YKK® Dual V-Zip™ og romslig konstruksjon gir fleksibel bruk gjennom flere situasjoner.',
            icon: 'badgeCheck'
          }
        ]
      },
      {
        type: 'comparison',
        title: 'TechDown™ i Utekos-familien',
        columns: [
          {
            title: 'TechDown™',
            text: 'For skiftende vær og lav terskel til bruk.',
            items: ['Syntetisk isolasjon', 'Teknisk allrounder', 'God for kyst, båt og terrasse']
          },
          {
            title: 'Dun™',
            text: 'For maksimal varmefølelse i kalde og tørre forhold.',
            items: ['Dunisolasjon', 'Høy varme i forhold til vekt', 'Klassisk loft og lunhet']
          },
          {
            title: 'Mikrofiber™',
            text: 'For robust, lett og enkelt vedlikehold.',
            items: ['Hurtigtørkende fiber', 'Allsidig bruk', 'Lett å vaske og pakke']
          }
        ]
      },
      {
        type: 'image',
        src: techdown1080,
        alt: 'Utekos TechDown produktet på rolig bakgrunn',
        width: 1080,
        height: 1080,
        caption: 'TechDown™ bygger videre på Utekos-silhuetten med en mer teknisk materialprofil.'
      },
      {
        type: 'cta',
        title: 'Finn ut om TechDown™ passer deg',
        text: 'Velg TechDown™ hvis du vil ha lav vekt, syntetisk isolasjon og et plagg som passer de fleste utesituasjoner.',
        primary: {
          href: '/produkter/utekos-techdown',
          label: 'Se TechDown™',
          trackingId: 'TechDownArticleProductClick'
        },
        secondary: {
          href: '/handlehjelp/sammenlign-modeller',
          label: 'Sammenlign modellene',
          trackingId: 'TechDownArticleCompareClick'
        }
      }
    ]
  },
  {
    slug: 'hva-er-utekos',
    title: 'Invester i din egen hygge',
    excerpt: 'Utekos er mer enn et klesmerke. Det er en enkel ide: mer ro, mer varme og mer tid ute.',
    category: 'Om Utekos',
    publishedAt: '2025-10-17T00:00:00+02:00',
    updatedAt: '2025-10-17T00:00:00+02:00',
    readingTimeMinutes: 9,
    author: { name: 'Utekos' },
    heroImage: {
      src: bat2,
      alt: 'Utekos brukt ved vannet i et rolig norsk landskap',
      width: 1536,
      height: 1024,
      caption: 'Filosofien er enkel: kroppen skal ha det godt, så øyeblikket får vare.'
    },
    seo: {
      title: 'Hva er Utekos? Historien og filosofien | Utekos Magasinet',
      description: 'Les historien bak Utekos og hvorfor personlig komfort ute er kjernen i produktfilosofien.'
    },
    theme: { accent: 'ancient-water', surface: 'light' },
    relatedSlugs: [
      'utekos-techdown-lansering',
      '5-enkle-tips-for-a-forlenge-terrassesongen',
      'slik-skaper-du-den-perfekte-stemningen-pa-hytta'
    ],
    blocks: [
      {
        type: 'lead',
        text: 'Utekos startet med et hverdagslig problem: Nordmenn elsker å være ute, men vi trekker ofte inn lenge før vi egentlig vil. Kulde, trekk og venting stjeler små øyeblikk som kunne blitt gode minner.'
      },
      {
        type: 'paragraph',
        text: 'Svaret ble ikke å varme opp hele omgivelsen. Svaret ble å gi kroppen sin egen lune sone. Når varmen følger deg, blir terrassen, hytten, båten og bobilen lettere å bruke.'
      },
      {
        type: 'featureGrid',
        title: 'Kjernen i Utekos',
        items: [
          {
            title: 'Kroppsnær varme',
            text: 'Komforten starter der du faktisk kjenner kulden.',
            icon: 'thermometer'
          },
          {
            title: 'Fleksibel bruk',
            text: 'Samme plagg skal fungere i mange overganger, ikke bare i én aktivitet.',
            icon: 'compass'
          },
          {
            title: 'Rolig design',
            text: 'Produktet skal føles mykt, praktisk og trygt uten å rope etter oppmerksomhet.',
            icon: 'heart'
          }
        ]
      },
      {
        type: 'heading',
        level: 2,
        text: 'Et plagg for overgangene'
      },
      {
        type: 'paragraph',
        text: 'De viktigste stundene ute skjer ofte i overgangene: før båten er klar, etter badet, mens grillen tar tid, når hytten fortsatt er kald eller når kaffen drikkes før resten av huset våkner.'
      },
      {
        type: 'image',
        src: erlingMesse,
        alt: 'Gründerhistorie og Utekos-produkt vist på messe',
        width: 1080,
        height: 1080,
        caption: 'Produktet ble formet av praktiske behov, kundemøter og mange kalde testkvelder.'
      },
      {
        type: 'comparison',
        title: 'Produktfamilien kort forklart',
        columns: [
          {
            title: 'TechDown™',
            items: ['Teknisk allrounder', 'Syntetisk isolasjon', 'For skiftende vær']
          },
          {
            title: 'Mikrofiber™',
            items: ['Lett og robust', 'Enkelt vedlikehold', 'For reise og allsidig bruk']
          },
          {
            title: 'Dun™',
            items: ['Maksimal varmefølelse', 'Klassisk dunloft', 'For kalde og tørre kvelder']
          }
        ]
      },
      {
        type: 'cta',
        title: 'Velg komforten som passer din rytme',
        text: 'Start med bruksområdet ditt, og finn modellen som gjør de gode stundene enklere å bli i.',
        primary: {
          href: '/produkter',
          label: 'Se alle produkter',
          trackingId: 'HvaErUtekosArticleProductsClick'
        },
        secondary: {
          href: '/handlehjelp/sammenlign-modeller',
          label: 'Sammenlign modellene',
          trackingId: 'HvaErUtekosArticleCompareClick'
        }
      }
    ]
  },
  {
    slug: 'balpannen-din-guide-til-den-perfekte-hostkvelden',
    title: 'Perfekt høstkveld med bålpannen',
    excerpt: 'Lær de fem P-ene for perfekt bålkos og skap en lun kveld rundt bålpannen.',
    category: 'Tips og råd',
    publishedAt: '2025-09-22T00:00:00+02:00',
    updatedAt: '2025-09-22T00:00:00+02:00',
    readingTimeMinutes: 6,
    author: { name: 'Utekos' },
    heroImage: {
      src: prikkenOverIen,
      alt: 'En varm og sosial høstkveld rundt bålpannen',
      width: 1536,
      height: 1024,
      caption: 'Bålpannen skaper samlingspunktet. Komforten gjør at folk blir sittende.'
    },
    theme: { accent: 'primary', surface: 'dark' },
    relatedSlugs: [
      '5-enkle-tips-for-a-forlenge-terrassesongen',
      'slik-skaper-du-den-perfekte-stemningen-pa-hytta',
      'den-ultimate-guiden-til-komfortabel-vintercamping'
    ],
    blocks: [
      {
        type: 'lead',
        text: 'En god bålkveld handler om mer enn flammer. Den handler om plassering, praktiske rammer, personlig varme og små detaljer som gjør at samtalen får tid.'
      },
      {
        type: 'stepList',
        title: 'De fem P-ene for bålkos',
        steps: [
          {
            title: 'Plassering',
            text: 'Velg et lunt sted med god avstand til vegger, tak, vegetasjon og gangsoner.'
          },
          {
            title: 'Preparering',
            text: 'Ha ved, fyrstikker, vann og sitteplasser klart før gjestene kommer.'
          },
          {
            title: 'Pledd og tekstiler',
            text: 'Legg frem tekstiler som isolerer fra både luft og kalde sitteflater.'
          },
          {
            title: 'Personlig varme',
            text: 'La kroppen beholde varmen, i stedet for å stole på at flammene treffer alle.'
          },
          {
            title: 'Prikken over i-en',
            text: 'Varme drikker, enkel mat og dempet lys gjør kvelden mer inviterende.'
          }
        ]
      },
      {
        type: 'image',
        src: balpanneSteinheller,
        alt: 'Bålpanne plassert trygt på steinheller',
        width: 1536,
        height: 1024,
        caption: 'Underlaget er en del av komforten. Trygge rammer gir ro.'
      },
      {
        type: 'featureGrid',
        title: 'Slik får du gjestene til å bli',
        items: [
          {
            title: 'Varme rundt kroppen',
            text: 'Når overkroppen er varm, kan du sitte lenger uten å trekke helt inn mot bålet.',
            icon: 'thermometer'
          },
          {
            title: 'Sittekomfort',
            text: 'Skinn, puter og pledd gjør en hard benk til en plass folk velger.',
            icon: 'layers'
          },
          {
            title: 'Rolig lys',
            text: 'Lykter og lav belysning gjør bålet til midtpunkt uten blendende kontraster.',
            icon: 'lightbulb'
          }
        ]
      },
      {
        type: 'cta',
        title: 'Gjør bålkvelden varmere',
        text: 'Med personlig varme kan du la flammene skape stemning, mens kroppen får stabil komfort.',
        primary: {
          href: '/produkter',
          label: 'Finn din Utekos',
          trackingId: 'BalpanneArticleShopPersonalHeatingClick'
        }
      }
    ]
  },
  {
    slug: 'vinterklargjoring-av-hytta-en-sjekkliste-for-livsnyteren',
    title: 'Sjekkliste: Vinterklargjøring av hytten',
    excerpt: 'Gjør vinterstengingen til en del av kosen med en ryddig sjekkliste for trygg hyttekomfort.',
    category: 'Hytteliv',
    publishedAt: '2025-09-21T00:00:00+02:00',
    updatedAt: '2025-09-21T00:00:00+02:00',
    readingTimeMinutes: 8,
    author: { name: 'Utekos' },
    heroImage: {
      src: '/og-image-hytte-host.webp',
      alt: 'En høstklar hytte som er forberedt for vinteren',
      width: 1500,
      height: 1000,
      caption: 'En god stenging gjør neste ankomst roligere, varmere og mer forutsigbar.'
    },
    theme: { accent: 'ancient-water', surface: 'light' },
    relatedSlugs: [
      'slik-skaper-du-den-perfekte-stemningen-pa-hytta',
      'beredskap-egenomsorg',
      'den-ultimate-guiden-til-komfortabel-vintercamping'
    ],
    blocks: [
      {
        type: 'lead',
        text: 'For en livsnyter handler vinterklargjøring om mer enn vedlikehold. Det handler om å gi fremtidige hytteturer en bedre start.'
      },
      {
        type: 'paragraph',
        text: 'Når uteområdet er sikret, vannet er kontrollert og inneklimaet er ivaretatt, kan du låse døren med lavere skuldre. Den neste turen begynner allerede nå.'
      },
      {
        type: 'stepList',
        title: 'Sjekklisten som gir ro',
        intro: 'Gå systematisk gjennom ute, inne og tekniske systemer før vinteren får feste.',
        steps: [
          {
            title: 'Uteområdet',
            text: 'Rydd utemøbler, tøm kraner, rens takrenner og fjern løse gjenstander som kan skades av vær.'
          },
          {
            title: 'Inneklima',
            text: 'Tøm kjøleskap, se etter sprekker og pakk tekstiler slik at de holder seg tørre.'
          },
          {
            title: 'Vann og strøm',
            text: 'Steng hovedstoppekran, trekk ut unødige kontakter og dokumenter temperaturen du lar stå igjen.'
          },
          {
            title: 'Neste ankomst',
            text: 'Legg igjen varme klær, fyrstikker og enkel mat der du finner dem med en gang.'
          }
        ]
      },
      {
        type: 'image',
        src: takrenne2,
        alt: 'Takrenne klargjort før vinteren',
        width: 1520,
        height: 1080,
        caption: 'Små tiltak ute kan spare store bekymringer når snø og frost kommer.'
      },
      {
        type: 'callout',
        tone: 'accent',
        title: 'Planlegg for den kalde ankomsten',
        text: 'En kald hytte kan ta timer å varme opp. Et Utekos-plagg på hytten gir komfort før peisen rekker å gjøre jobben.'
      },
      {
        type: 'cta',
        title: 'Gjør neste hyttetur enklere',
        text: 'La varmen ligge klar på hytten, så starter kosen idet du åpner døren.',
        primary: {
          href: '/produkter',
          label: 'Sikre neste hyttetur',
          trackingId: 'VinterklargjoringArticleProductsClick'
        }
      }
    ]
  },
  {
    slug: '5-enkle-tips-for-a-forlenge-terrassesongen',
    title: 'Så enkelt forlenger du terrassesesongen',
    excerpt: 'Med noen smarte grep kan uteplassen din bli en lun sone fra tidlig vår til sen høst.',
    category: 'Terrasseliv',
    publishedAt: '2025-09-20T00:00:00+02:00',
    updatedAt: '2025-09-20T00:00:00+02:00',
    readingTimeMinutes: 6,
    author: { name: 'Utekos' },
    heroImage: {
      src: '/og-image-terrassen.webp',
      alt: 'En terrasse som inviterer til bruk langt utover sommeren',
      width: 1024,
      height: 683,
      caption: 'Din oase, klar for de kjølige, klare kveldene.'
    },
    theme: { accent: 'mountain-view', surface: 'light' },
    relatedSlugs: [
      'balpannen-din-guide-til-den-perfekte-hostkvelden',
      'slik-skaper-du-den-perfekte-stemningen-pa-hytta',
      'utekos-techdown-lansering'
    ],
    blocks: [
      {
        type: 'lead',
        text: 'Med noen enkle, men effektive grep kan du forvandle terrassen din fra en ren sommerdestinasjon til et favorittsted som kan brukes store deler av året.'
      },
      {
        type: 'paragraph',
        text: 'Ved å kombinere varme, skjerming, gode materialer og riktig lys skaper du en sone som inviterer til bruk også når temperaturen faller. Løsningene er skalerbare for både små og store uteplasser, enkle å sette ut i livet og tilpasset nordisk klima.'
      },
      {
        type: 'featureGrid',
        title: 'Fem grep som gjør størst forskjell',
        intro:
          'Disse tiltakene bygger på de eksisterende terrasse-endringene og samler dem i et vedlikeholdbart mønster.',
        items: [
          {
            title: 'Tekstiler og pledd',
            text: 'Myke ullpledd, puter og saueskinn isolerer og skaper en umiddelbar følelse av lunhet.',
            icon: 'layers'
          },
          {
            title: 'Riktig belysning',
            text: 'Varme, dempede lyskilder som lysslynger og lykter skaper en intim og trygg atmosfære.',
            icon: 'lightbulb'
          },
          {
            title: 'Le for vinden',
            text: 'En enkel levegg, planter eller en lun krok reduserer trekk og gjør varmen mer effektiv.',
            icon: 'leaf'
          },
          {
            title: 'Personlig varme',
            text: 'Kroppsnær varme bruker mindre energi enn å varme opp all luften rundt deg.',
            icon: 'thermometer'
          },
          {
            title: 'Varme drikker',
            text: 'Te, kakao eller kaffe varmer fra innsiden og gjør pausen til en del av ritualet.',
            icon: 'coffee'
          }
        ]
      },
      {
        type: 'paragraph',
        text: 'Den virkelige forskjellen kommer når varmen følger kroppen. I stedet for å prøve å varme opp hele uteplassen, holder du jevn temperatur selv i trekk og kan sitte lenger uten å flytte deg nærmere flammen.'
      },
      {
        type: 'callout',
        tone: 'commerce',
        title: 'Den viktigste investeringen',
        text: 'Personlig varme gir størst effekt når du vil bruke terrassen mer. Et Utekos-plagg er laget for nettopp dette: frisk luft uten at komforten forsvinner.'
      },
      {
        type: 'cta',
        title: 'Ta tilbake sesongene',
        text: 'Kombiner le, tekstiler og kroppsnær varme, så får terrassen en langt lengre brukssesong.',
        primary: {
          href: '/produkter',
          label: 'Oppdag personlig varme',
          trackingId: 'TerrasseArticleShopPersonalHeatingClick'
        }
      }
    ]
  },
  {
    slug: 'slik-skaper-du-den-perfekte-stemningen-pa-hytta',
    title: 'Skap de perfekte hyttestemningen',
    excerpt: 'Utforsk lys, lyd, tekstur og komfort som gjør hytten roligere og mer inviterende.',
    category: 'Hytteliv',
    publishedAt: '2025-09-18T00:00:00+02:00',
    updatedAt: '2025-09-18T00:00:00+02:00',
    readingTimeMinutes: 7,
    author: { name: 'Utekos' },
    heroImage: {
      src: '/og-image-hytte.webp',
      alt: 'Et varmt og stemningsfullt hytteinteriør',
      width: 1500,
      height: 1000,
      caption: 'Hyttekos handler om rytme, materialer og varme som ikke krever forklaring.'
    },
    theme: { accent: 'ancient-water', surface: 'light' },
    relatedSlugs: [
      'vinterklargjoring-av-hytta-en-sjekkliste-for-livsnyteren',
      'balpannen-din-guide-til-den-perfekte-hostkvelden',
      'hva-er-utekos'
    ],
    blocks: [
      {
        type: 'lead',
        text: 'Den perfekte hyttestemningen oppstår når rommet gjør det lett å senke skuldrene. Peis og varme hjelper, men detaljene rundt er ofte det som avgjør følelsen.'
      },
      {
        type: 'featureGrid',
        title: 'Formelen for hyttekos',
        items: [
          {
            title: 'Lagdelt lys',
            text: 'Bruk flere lave lyskilder i stedet for én sterk taklampe.',
            icon: 'lightbulb'
          },
          {
            title: 'Hørbar ro',
            text: 'Knitring, lav musikk og mindre skjermstøy gjør rommet mykere.',
            icon: 'heart'
          },
          {
            title: 'Fysisk komfort',
            text: 'Varme plagg, myke tekstiler og gode sitteplasser gjør at kroppen slapper av.',
            icon: 'layers'
          }
        ]
      },
      {
        type: 'image',
        src: lagdeltLys,
        alt: 'Lagdelt lys i et varmt hyttemiljø',
        width: 1536,
        height: 1024,
        caption: 'Lys i flere nivåer gir rommet dybde uten å bli hardt.'
      },
      {
        type: 'paragraph',
        text: 'Hytten skal tåle at dagen skifter tempo. Den skal fungere for morgenkaffe, våte klær, sene måltider og stille lesing. Da må komforten være praktisk, ikke pyntet.'
      },
      {
        type: 'cta',
        title: 'Gjør hyttestemningen lettere å finne',
        text: 'La personlig varme være en del av hyttens faste komfortlag.',
        primary: {
          href: '/inspirasjon/hytteliv',
          label: 'Se mer hytteliv',
          trackingId: 'HyttekosArticleInspirationClick'
        },
        secondary: {
          href: '/produkter',
          label: 'Se produktene',
          trackingId: 'HyttekosArticleProductsClick'
        }
      }
    ]
  },
  {
    slug: 'den-ultimate-guiden-til-komfortabel-vintercamping',
    title: 'Guiden for komfortabel vintercamping',
    excerpt: 'Vintercamping kan være magisk hvis du er godt forberedt på kulde, rutiner og varme pauser.',
    category: 'Bobilliv',
    publishedAt: '2025-09-15T00:00:00+02:00',
    updatedAt: '2025-09-15T00:00:00+02:00',
    readingTimeMinutes: 9,
    author: { name: 'Utekos' },
    heroImage: {
      src: vintercamp2,
      alt: 'Bobil i vinterlandskap med varmt lys fra innsiden',
      width: 1536,
      height: 1024,
      caption: 'Vintercamping blir best når varme og rutiner er planlagt før avreise.'
    },
    theme: { accent: 'bleached-mauve', surface: 'light' },
    relatedSlugs: [
      'bobil-i-hostferien-de-vakreste-rutene-for-a-oppleve-hostfargene',
      'beredskap-egenomsorg',
      'vinterklargjoring-av-hytta-en-sjekkliste-for-livsnyteren'
    ],
    blocks: [
      {
        type: 'lead',
        text: 'Vintercamping handler ikke om å tåle mest mulig. Det handler om å gjøre kulden forutsigbar, slik at naturen får hovedrollen.'
      },
      {
        type: 'stepList',
        title: 'Før du drar',
        steps: [
          {
            title: 'Sjekk varmekilden',
            text: 'Kontroller gass, strøm, batteri og ventilasjon før turen.'
          },
          {
            title: 'Pakk i soner',
            text: 'Hold vått, tørt, varmt og mat adskilt. Det gjør små rom lettere å leve i.'
          },
          {
            title: 'Planlegg pauser',
            text: 'Legg inn stopp der du faktisk kan gå ut og nyte lyset, ikke bare fylle på.'
          },
          {
            title: 'Ta med personlig varme',
            text: 'Et varmt plagg gjør morgenkaffen, utsikten og kveldsrunden enklere.'
          }
        ]
      },
      {
        type: 'image',
        src: utekosSaueskinn,
        alt: 'Utekos og saueskinn som del av en varm vintercamping-pakke',
        width: 1536,
        height: 1024,
        caption: 'Tekstiler og personlig varme gjør bobilens små soner mer behagelige.'
      },
      {
        type: 'comparison',
        title: 'To komfortsoner du bør planlegge',
        columns: [
          {
            title: 'Bobilen',
            items: ['Tørr lufting', 'Fast plass til våte klær', 'Varme tilgjengelig ved døren']
          },
          {
            title: 'Uteplassen',
            items: ['Sitteunderlag', 'Termos og enkel mat', 'Plagg som tåler pauser i kulden']
          }
        ]
      },
      {
        type: 'cta',
        title: 'Gjør vintercamping lunere',
        text: 'Ta med et plagg som fungerer både i bobilen, ved døren og ute i pausen.',
        primary: {
          href: '/produkter',
          label: 'Utforsk Utekos',
          trackingId: 'VintercampingArticleExploreUtekosClick'
        }
      }
    ]
  },
  {
    slug: 'bobil-i-hostferien-de-vakreste-rutene-for-a-oppleve-hostfargene',
    title: 'Opplev høstfargene her',
    excerpt: 'Opplev Norges høstfarger fra første rad med to ruter som gir ro, utsikt og varme stopp.',
    category: 'Bobilliv',
    publishedAt: '2025-09-22T00:00:00+02:00',
    updatedAt: '2025-09-22T00:00:00+02:00',
    readingTimeMinutes: 7,
    author: { name: 'Utekos' },
    heroImage: {
      src: '/og-image-bobil-host.webp',
      alt: 'Bobilreise gjennom norske høstfarger',
      width: 1024,
      height: 683,
      caption: 'Høsten er bobilens rolige gullsesong når du pakker for varme stopp.'
    },
    theme: { accent: 'bleached-mauve', surface: 'light' },
    relatedSlugs: [
      'den-ultimate-guiden-til-komfortabel-vintercamping',
      '5-enkle-tips-for-a-forlenge-terrassesongen',
      'varm-og-klar-for-batpussen'
    ],
    blocks: [
      {
        type: 'lead',
        text: 'Høstferien i bobil gir deg frihet til å følge fargene. De beste rutene har korte etapper, gode stopp og nok varme til at utsikten får vare.'
      },
      {
        type: 'featureGrid',
        title: 'To ruter med høy høstfaktor',
        items: [
          {
            title: 'Fjell og fjord',
            text: 'Kjør korte fjelletapper, stopp ved utsiktspunkt og ta kvelden nær vann eller dalføre.',
            icon: 'mountain'
          },
          {
            title: 'Kyst og skog',
            text: 'Følg lavere temperaturer langs kysten, og legg inn lune skogspauser underveis.',
            icon: 'map'
          }
        ]
      },
      {
        type: 'stepList',
        title: 'Slik pakker du for høststopp',
        steps: [
          {
            title: 'Hold varm sone nær døren',
            text: 'Legg Utekos, lue og termos slik at pausen starter raskt.'
          },
          {
            title: 'Planlegg lys',
            text: 'Høstdager er korte. Velg stopp der du rekker utsikten før mørket kommer.'
          },
          {
            title: 'Pakk tørt og komprimert',
            text: 'Bruk poser og kompresjon slik at små rom ikke blir rotete.'
          }
        ]
      },
      {
        type: 'cta',
        title: 'Gjør høstferien varmere',
        text: 'Med personlig varme blir korte stopp til små opplevelser, ikke bare pauser.',
        primary: {
          href: '/produkter',
          label: 'Se alle produkter',
          trackingId: 'BobilHostruterArticleAllProductsClick'
        }
      }
    ]
  },
  {
    slug: 'varm-og-klar-for-batpussen',
    title: 'Vårpussen av båten med komfort.',
    excerpt: 'Vårpussen er et sikkert vårtegn, men kan bli langt bedre når kroppen holder jevn varme.',
    category: 'Båtliv',
    publishedAt: '2025-04-12T00:00:00+02:00',
    updatedAt: '2025-04-12T00:00:00+02:00',
    readingTimeMinutes: 5,
    author: { name: 'Utekos' },
    heroImage: {
      src: kateErlingGressVann,
      alt: 'Vårpuss av båt ved vannkanten',
      width: 1200,
      height: 630,
      caption: 'Båtpussen går lettere når pauser, vind og skiftende vær er tatt med i planen.'
    },
    theme: { accent: 'very-peri', surface: 'light' },
    relatedSlugs: [
      'utekos-techdown-lansering',
      'bobil-i-hostferien-de-vakreste-rutene-for-a-oppleve-hostfargene',
      '5-enkle-tips-for-a-forlenge-terrassesongen'
    ],
    blocks: [
      {
        type: 'lead',
        text: 'Båtpuss skjer ofte i vær som skifter fort. Solen varmer i le, vinden biter på bryggen, og arbeidet veksler mellom rolig venting og fysisk innsats.'
      },
      {
        type: 'stepList',
        title: 'Hold varmen gjennom arbeidsdagen',
        steps: [
          {
            title: 'Kle deg for pauser',
            text: 'Det er ofte når du stopper opp at kulden kommer. Ha et varmt lag lett tilgjengelig.'
          },
          {
            title: 'Beskytt mot vind',
            text: 'Velg plagg som dekker overkropp og hender når du står stille ved vannet.'
          },
          {
            title: 'Hold ting tørre',
            text: 'Pakk varmeplagg i bilen eller under tak når vask, olje og sjøsprøyt er i nærheten.'
          }
        ]
      },
      {
        type: 'featureGrid',
        title: 'Når Utekos gir mest mening på bryggen',
        items: [
          {
            title: 'Før arbeidet starter',
            text: 'Morgenluft ved vannet kan være kald lenge etter at solen står opp.',
            icon: 'sun'
          },
          {
            title: 'Mellom øktene',
            text: 'Varme i pausen gjør det lettere å komme i gang igjen.',
            icon: 'coffee'
          },
          {
            title: 'Etter sjøsetting',
            text: 'Når båten endelig er klar, skal kroppen også være klar for tur.',
            icon: 'waves'
          }
        ]
      },
      {
        type: 'cta',
        title: 'Start båtsesongen i varme',
        text: 'Et plagg som holder deg varm i pausen, gjør hele vårpussen mer behagelig.',
        primary: {
          href: '/inspirasjon/batliv',
          label: 'Se båtliv med Utekos',
          trackingId: 'BatpussArticleBoatInspirationClick'
        },
        secondary: {
          href: '/produkter',
          label: 'Se produktene',
          trackingId: 'BatpussArticleProductsClick'
        }
      }
    ]
  }
] satisfies MagazineArticleInput[]
