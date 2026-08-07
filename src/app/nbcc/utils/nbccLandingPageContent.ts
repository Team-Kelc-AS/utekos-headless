import type { Route } from 'next'

import type {
  NbccFaqItem,
  NbccHeroTracking,
  NbccProduct,
  NbccStep,
  NbccTrackingData,
  NbccUseCase
} from '../types'
import comfyrobeManWall from '@/assets/images/comfyrobe/Comfyrobe-Man-Wall-Logo-800x800.webp'
import comfyrobeManOutside from '@/assets/images/comfyrobe/Comfyrobe-Man-Outside-Logo-800x800.webp'
import comfyrobeWoman from '@/assets/images/comfyrobe/Comfyrobe-Woman-Logo-800x800.webp'
import comfyrobeFrontWall from '@/assets/images/comfyrobe/Comfyrobe-FrontWall-Logo-800x800.webp'
import comfyrobeBacksideWall from '@/assets/images/comfyrobe/Comfyrobe-Backside-Wall-Logo-800x800.webp'
import comfyrobeCampaignV2 from '@/assets/images/comfyrobe/Comfyrobe-Campaign.v2-Logo-800x800.webp'
import mikrofiberWoodsOff from '@/assets/images/mikrofiber/Mikrofiber-Woods-Off-Logo-800x800.webp'
import mikrofiberWoman from '@/assets/images/mikrofiber/Mikrofiber-Woman-Logo-800x800.webp'
import mikrofiberFrontFull from '@/assets/images/mikrofiber/Mikrofiber-Front-Full-Logo-800x800.webp'
import mikrofiberBacksideWall from '@/assets/images/mikrofiber/Mikrofiber-Backside-Wall-Logo-800x800.webp'
import mikrofiberFrontHalfWall from '@/assets/images/mikrofiber/Mikrofiber-Front-Half-Wall-Logo-800x800.webp'
import techdownWomanWallKikkert from '@/assets/images/techdown/TechDown-WomanWall-Kikkert-v4-Logo-1200x1200.webp'
import techdownWomenKikkert from '@/assets/images/techdown/TechDown-Women-Kikkert-Logo-800x800.webp'
import techdownWomanWall from '@/assets/images/techdown/TechDown-Woman-Wall-Logo-800x800.webp'
import techdownBackside from '@/assets/images/techdown/TechDown-Backside-Logo-800x800.webp'
import techdownDiagonalWall from '@/assets/images/techdown/TechDown-Diagoal-Logo-Wall-800x800.webp'
import techdownFullFront from '@/assets/images/techdown/TechDown-FullFront-Logo-800x800.webp'
import techdownBackSideHalv from '@/assets/images/techdown/TechDown-BackSide-Halv-Logo-800x800.webp'
import techdownFrontHalv from '@/assets/images/techdown/TechDown-Front-Halv-Logo-800x800.webp'


export const nbccHeroTracking = {
  primary: {
    page: 'nbcc',
    section: 'hero',
    target: 'products'
  },
  secondary: {
    page: 'nbcc',
    section: 'hero',
    target: 'how-to-use'
  }
} satisfies NbccHeroTracking

export const nbccProducts = [
  {
    title: 'Utekos TechDown™',
    shortTitle: 'TechDown',
    description:
      'Vår nyeste og mest allsidige modell. Nyskapende innerfor som gir en følelse av dun og opprettholder spenstegenenskapene ved fukt.',
    bestFor: 'For bobil, campingvogn, fortelt og faste plasser.',
    images: [
      {
        src: techdownWomanWallKikkert,
        alt: 'Kvinne med kikkert i Utekos TechDown™'
      },
      {
        src: techdownWomenKikkert,
        alt: 'Kvinner med kikkert i Utekos TechDown™'
      },
      {
        src: techdownWomanWall,
        alt: 'Kvinne i Utekos TechDown™ foran vegg'
      },
      {
        src: techdownBackside,
        alt: 'Utekos TechDown™ sett bakfra'
      },
      {
        src: techdownDiagonalWall,
        alt: 'Utekos TechDown™ diagonalt mot vegg'
      },
      {
        src: techdownFullFront,
        alt: 'Utekos TechDown™ helfigur forfra'
      },
      {
        src: techdownBackSideHalv,
        alt: 'Utekos TechDown™ halvfigur bakfra'
      },
      {
        src: techdownFrontHalv,
        alt: 'Utekos TechDown™ halvfigur forfra'
      }
    ],
    href: '/produkter/utekos-techdown' as Route,
    handle: 'utekos-techdown',
    sizes: ['Middels', 'Stor', 'Ekstra Stor'],
    tracking: {
      page: 'nbcc',
      section: 'products',
      product: 'utekos-techdown'
    }
  },
  {
    title: 'Utekos Mikrofiber™',
    shortTitle: 'Mikrofiber',
    description:
      'Lett, praktisk og enkel å pakke med når du vil ha et varmt lag klart ved stolen eller markisen.',
    bestFor: 'For sommerhalvåret, reisedager og raske turer ut.',
    images: [
      {
        src: mikrofiberWoodsOff,
        alt: 'Utekos Mikrofiber™ i skogen'
      },
      {
        src: mikrofiberWoman,
        alt: 'Kvinne i Utekos Mikrofiber™'
      },
      {
        src: mikrofiberFrontFull,
        alt: 'Utekos Mikrofiber™ helfigur forfra'
      },
      {
        src: mikrofiberBacksideWall,
        alt: 'Utekos Mikrofiber™ sett bakfra mot vegg'
      },
      {
        src: mikrofiberFrontHalfWall,
        alt: 'Utekos Mikrofiber™ halvfigur forfra mot vegg'
      }
    ],
    href: '/produkter/utekos-mikrofiber' as Route,
    handle: 'utekos-mikrofiber',
    sizes: ['Medium', 'Large'],
    color: 'Fjellblå',
    tracking: {
      page: 'nbcc',
      section: 'products',
      product: 'utekos-mikrofiber'
    }
  },
  {
    title: 'Comfyrobe™',
    shortTitle: 'Comfyrobe™',
    description:
      'Vindtett, 8000 vannsøyle og lun etter dusj, bad eller en våt runde over campingplassen.',
    bestFor: 'For våte morgener, skifte etter bad og kjølige kvelder ute.',
    images: [
      {
        src: comfyrobeManWall,
        alt: 'Mann i Comfyrobe foran vegg'
      },
      {
        src: comfyrobeManOutside,
        alt: 'Mann i Comfyrobe utendørs'
      },
      {
        src: comfyrobeWoman,
        alt: 'Kvinne i Comfyrobe'
      },
      {
        src: comfyrobeFrontWall,
        alt: 'Comfyrobe forfra mot vegg'
      },
      {
        src: comfyrobeBacksideWall,
        alt: 'Comfyrobe sett bakfra mot vegg'
      },
      {
        src: comfyrobeCampaignV2,
        alt: 'Comfyrobe kampanjebilde'
      }
    ],
    href: '/produkter/comfyrobe' as Route,
    handle: 'comfyrobe',
    sizes: ['XS', 'XL'],
    color: 'Fjellnatt',
    tracking: {
      page: 'nbcc',
      section: 'products',
      product: 'comfyrobe'
    }
  }
] satisfies NbccProduct[]

export const nbccUseCases = [
  {
    title: 'Utenfor bobilen',
    description:
      'Ta steget ut og nyt morgenkaffen i duggfrisk luft, uten å måtte lete frem ekstra klær i halvmørket, mens du gnir søvnen ut av øynene.'
  },
  {
    title: 'Skumringstimen',
    description:
      'Når campingbordet er slått ut og scenen er satt, men den varme ettermiddagen glir på kjent norsk vis brått over til en kjølig kveld.'
  },
  {
    title: 'Ved campingvognen',
    description:
      'Forvandler konseptet "nå må vi snart bevege oss inn, det begynner å bli kaldt" om til en gradvis utfasende myte.'
  },
  {
    title: 'Spontane nabobesøk',
    description:
      'Når campingnaboen stikker innom på et spontant besøk, og du vil skape en lun og gjestfri atmosfære der ingen begynner å fryse.'
  },
  {
    title: 'På treff og tur',
    description:
      'En skreddersydd løsning for alle de sosiale opplevelsene man skal ha rundt campingbordet med gjengen, og alt det i mellom.'
  },
  {
    title: 'På fastplassen og hjemme',
    description:
      'Fremtrer med sin aktualitet fastplassen, men også når du er på hytten, i båten eller bare skal rett ut på terrassen hjemme.'
  }
] satisfies NbccUseCase[]

export const nbccSteps = [
  {
    title: 'Finn fordelen hos NBCC',
    description: 'Som medlem finner du fordelskoden i Min Side / Gnist under medlemsfordeler.'
  },
  {
    title: 'Velg produktene hos Utekos',
    description: 'Velg mellom TechDown, Mikrofiber og Comfyrobe, og legg i handlekurven'
  },
  {
    title: 'Bruk fordelen i kassen',
    description:
      'Når du har funnet det du ønsker deg, legger du bare inn koden i kassen. Da oppdateres prisen til din unike medlemspris helt automatisk.'
  }
] satisfies NbccStep[]

export const nbccFaqItems = [
  {
    question: 'Hvor finner jeg fordelskoden?',
    answer:
      'Som NBCC-medlem finner du den unike rabattkoden din i Gnist-appen, eller ved å logge inn på "Min Side" på www.nbocc.no under medlemsfordeler. Koden legger du enkelt inn i kassen her hos oss, så trekkes rabatten automatisk.'
  },
  {
    question: 'Kan plagget brukes av både kvinner og menn?',
    answer:
      'Ja, Utekos er designet som et unisex-plagg. Se gjerne størrelsesguiden vår for å finne ut hva som passer deg best!'
  },
  {
    question: 'Hvilket Utekos-produkt passer best på camping?',
    answer:
      'Det avhenger litt av dine behov. TechDown er vår varmeste og mest fleksible modell, perfekt for kjølige kvelder under markisen. Mikrofiber er litt lettere og utrolig praktisk å pakke med seg på tur. Er du ute etter vind- og vanntett beskyttelse til ruskeværsdager eller etter kveldsbadet, er Comfyrobe et utmerket valg.'
  },
  {
    question: 'Kan jeg bruke Utekos i forteltet?',
    answer:
      'Ja, helt klart! Utekos er skapt for nettopp å gi komfort og varme i utendørs omgivelser. Å sitte i forteltet med gode venner når kveldskulden smyger seg på, er kanskje den aller beste anledningen til å finne frem Utekos. Det gir den deilige, lune varmen som gjør at dere kan bli sittende ute mye lenger.'
  },
  {
    question: 'Hva hvis størrelsen ikke passer?',
    answer:
      'Det er ingen fare. Du kan besøke vår størrelsesguide via lenken før du bestiller, for å finne din perfekte passform. Skulle uhellet likevel være ute, har du selvfølgelig 14 dagers full retur- og bytterett, slik at du raskt og enkelt kan bytte til en størrelse som sitter perfekt.'
  }
] satisfies NbccFaqItem[]

export const nbccFinalCtaTracking = {
  page: 'nbcc',
  section: 'final-cta',
  target: 'products'
} satisfies NbccTrackingData
