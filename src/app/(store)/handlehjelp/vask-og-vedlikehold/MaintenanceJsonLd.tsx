import { cacheLife, cacheTag } from 'next/cache'
import { SITE_URL } from '@/constants'
import type {
  BreadcrumbList,
  FAQPage,
  HowTo,
  WebPage,
  Graph
} from 'schema-dts'

const PAGE_URL = `${SITE_URL}/handlehjelp/vask-og-vedlikehold`
const ORG_ID = `${SITE_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`
const WEBPAGE_ID = `${PAGE_URL}#webpage`
const BREADCRUMB_ID = `${PAGE_URL}#breadcrumb`
const HOWTO_ID = `${PAGE_URL}#howto`
const FAQ_ID = `${PAGE_URL}#faq`

export async function MaintenanceJsonLd() {
  'use cache'
  cacheLife('max')
  cacheTag('jsonld-maintenance')

  const webPage: WebPage = {
    '@type': 'WebPage',
    '@id': WEBPAGE_ID,
    'url': PAGE_URL,
    'name':
      'Vedlikehold av Utekos | Slik bevarer du varmen i mange år',
    'description':
      'En tydelig vedlikeholdsguide for Utekos Dun, Mikrofiber, TechDown og Comfyrobe. Riktig vask, tørking og oppbevaring bevarer varmen, formen og kvaliteten – sesong etter sesong.',
    'inLanguage': 'no',
    'isPartOf': { '@id': WEBSITE_ID },
    'breadcrumb': { '@id': BREADCRUMB_ID },
    'primaryImageOfPage': {
      '@type': 'ImageObject',
      'url': 'https://utekos.no/og-image-utekos-produkter.jpg',
      'width': '1200',
      'height': '630'
    },
    'mainEntity': { '@id': HOWTO_ID },
    'publisher': { '@id': ORG_ID }
  }

  const breadcrumb: BreadcrumbList = {
    '@type': 'BreadcrumbList',
    '@id': BREADCRUMB_ID,
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Forsiden',
        'item': SITE_URL
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Vask og vedlikehold'
      }
    ]
  }

  const howTo: HowTo = {
    '@type': 'HowTo',
    '@id': HOWTO_ID,
    'name': 'Slik tar du vare på Utekos-plagget ditt',
    'description':
      'Steg-for-steg-guide til forberedelse, vask, tørking og oppbevaring av Utekos-produkter for maksimal levetid og bevart varme.',
    'inLanguage': 'no',
    'image': {
      '@type': 'ImageObject',
      'url': 'https://utekos.no/og-image-utekos-produkter.jpg',
      'width': '1200',
      'height': '630'
    },
    'totalTime': 'PT2H',
    'supply': [
      {
        '@type': 'HowToSupply',
        'name': 'Mildt vaskemiddel uten optisk hvitt'
      },
      {
        '@type': 'HowToSupply',
        'name': 'Tørkeballer eller rene tennisballer (for dun)'
      },
      {
        '@type': 'HowToSupply',
        'name': 'DWR-impregneringsspray (valgfritt)'
      }
    ],
    'tool': [
      {
        '@type': 'HowToTool',
        'name': 'Vaskemaskin med skånsomt program'
      },
      {
        '@type': 'HowToTool',
        'name': 'Tørketrommel med lav varme'
      }
    ],
    'step': [
      {
        '@type': 'HowToStep',
        'name': 'Forberedelse',
        'text':
          'Lukk alle glidelåser, fest borrelås og tøm lommer. Vreng plagget for å skåne ytterstoffet og bevare DWR-behandlingen.',
        'position': 1,
        'url': `${PAGE_URL}#forberedelse`
      },
      {
        '@type': 'HowToStep',
        'name': 'Vask',
        'text':
          'Vask på skånsomt program med kaldt eller lunkent vann og mildt vaskemiddel. Unngå tøymykner – det legger seg som en film og reduserer pusteegenskaper og isolasjon.',
        'position': 2,
        'url': `${PAGE_URL}#vask`
      },
      {
        '@type': 'HowToStep',
        'name': 'Tørking',
        'text':
          'Tørketrommel på lav varme med tørkeballer for dun. Mikrofiber lufttørkes raskt på henger. Sørg for at plagget er 100 % gjennomtørt før det legges bort.',
        'position': 3,
        'url': `${PAGE_URL}#torking`
      },
      {
        '@type': 'HowToStep',
        'name': 'Oppbevaring',
        'text':
          'Heng plagget luftig mellom sesongene. Unngå kompresjonsposer over tid – det svekker dunets spenst og fibrenes struktur.',
        'position': 4,
        'url': `${PAGE_URL}#oppbevaring`
      }
    ],
    'publisher': { '@id': ORG_ID },
    'author': { '@id': ORG_ID },
    'mainEntityOfPage': { '@id': WEBPAGE_ID }
  }

  const faq: FAQPage = {
    '@type': 'FAQPage',
    '@id': FAQ_ID,
    'inLanguage': 'no',
    'isPartOf': { '@id': WEBPAGE_ID },
    'author': { '@id': ORG_ID },
    'publisher': { '@id': ORG_ID },
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Hvor ofte bør jeg vaske Utekos-plagget mitt?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text':
            'Vask sjeldnere enn du tror. Lufting mellom hver bruk er som regel nok. Vask når plagget faktisk er skittent. Hyppig vask sliter mer på fibrene enn vanlig bruk.'
        }
      },
      {
        '@type': 'Question',
        'name':
          'Kan jeg bruke vanlig vaskemiddel på Utekos Dun?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text':
            'Bruk helst et mildt vaskemiddel uten optisk hvitt, eller et eget dunvaskemiddel. Vanlige vaskemidler kan tørke ut dunets naturlige fettlag og redusere isolasjonsevnen over tid.'
        }
      },
      {
        '@type': 'Question',
        'name':
          'Hva gjør jeg hvis vann ikke lenger preller av ytterstoffet?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text':
            'DWR-behandlingen kan friskes opp. Vask plagget rent, tørk det helt og påfør en egnet impregneringsspray jevnt over ytterstoffet. Bruk lav varme til aktivering bare når vaskelappen og produktveiledningen tillater det.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Kan dunet klumpe seg under vask?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text':
            'Ja. Bruk tørketrommel på lav varme med tørkeballer når vaskelappen tillater det, og avbryt syklusen for å riste ut klumper underveis. Plagget skal være helt gjennomtørt før det legges bort.'
        }
      },
      {
        '@type': 'Question',
        'name':
          'Hvordan oppbevarer jeg plagget mellom sesonger?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text':
            'Heng plagget på en stødig henger i et tørt og luftig skap. Unngå kompresjonsposer og plastomslag over lengre tid. Isolasjonen trenger luft og plass for å bevare spensten.'
        }
      }
    ]
  }

  const graph: Graph = {
    '@context': 'https://schema.org',
    '@graph': [webPage, breadcrumb, howTo, faq]
  }

  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replace(/</g, '\\u003c')
      }}
    />
  )
}
