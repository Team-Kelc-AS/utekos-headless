// Path: src/app/handlehjelp/teknologi-materialer/config.ts
import type { TechnologyGroup } from './types'

export const technologyGroups: readonly TechnologyGroup[] = [
  {
    groupTitle: 'Utekos TechDown™',
    technologies: [
      {
        icon: 'gem',
        title: 'Luméa™ Shell',
        iconColor: 'text-sky-800',
        content:
          'Vårt mest eksklusive ytterstoff, ingeniørt spesifikt for TechDown™-serien. Den tettvevde, premium nylonkonstruksjonen leverer en sofistikert matt finish og eksepsjonell taktil mykhet. Materialet er behandlet for å være naturlig vannavvisende, og balanserer luksuriøs komfort med høy slitestyrke.',
        products: ['Utekos TechDown™']
      },
      {
        icon: 'cloud',
        title: 'CloudWeave™ Insulation',
        iconColor: 'text-sky-800',
        content:
          'Kjernen i TechDown™. En avansert syntetisk isolasjonsstruktur utviklet for å etterligne dunets loft og kompresjonsevne. Den avgjørende tekniske fordelen er materialets hydrofobiske egenskaper; CloudWeave™ opprettholder sin isolasjonsverdi (CLO) selv under fuktige forhold, hvor tradisjonelt dun ville kollapset.',
        products: ['Utekos TechDown™']
      }
    ]
  },
  {
    groupTitle: 'Utekos Dun™',
    technologies: [
      {
        icon: 'thermometer',
        title: 'Fillpower 650 – Termisk effektivitet',
        iconColor: 'text-orange-500',
        content:
          'Dun som leverer markedsledende varme-til-vekt-ratio. Med en fillpower på 650 oppnås en optimal balanse mellom isolasjonsevne og pakkevolum. Dette skaper den karakteristiske "omsluttende" følelsen, samtidig som det sikrer maksimal varmebevaring i nordiske temperaturer.',
        products: ['Utekos Dun™']
      },
      {
        icon: 'shield',
        title: 'DWR Performance Nylon',
        iconColor: 'text-orange-500',
        content:
          'Et robust lettvekts-ytterstoff forsterket med DWR-behandling (Durable Water Repellent). Konstruksjonen gir pålitelig beskyttelse mot lett nedbør og snø, samtidig som den opprettholder pusteevnen. Stoffet har også flammehemmende egenskaper for økt sikkerhet rundt bålplassen.',
        products: ['Utekos Dun™', 'Utekos Mikrofiber™']
      }
    ]
  },
  {
    groupTitle: 'Utekos Mikrofiber™',
    technologies: [
      {
        icon: 'wind',
        title: 'DuraLite™ Nylon (20D/380T)',
        iconColor: 'text-cyan-500',
        content:
          'Konstruert for nordisk terreng. DuraLite™ er et teknisk 20D/380T lettvektsmateriale som balanserer høy slitestyrke med minimal vekt. Materialet er vindtett og sterkt vannavvisende, med en fiberstruktur som tillater utmerket fukttransport fra innsiden. Utviklet for å tåle mekanisk slitasje fra røft terreng.',
        products: ['Utekos Mikrofiber™']
      },
      {
        icon: 'feather',
        title: 'Hurtigtørkende fiber',
        iconColor: 'text-cyan-500',
        content:
          'En slitesterk isolasjonsteknologi designet for høyfrekvent bruk. Mikrofibrene danner luftlommer som effektivt fanger kroppsvarme, samtidig som materialet har ekstremt lave fuktabsorberende egenskaper. Dette sikrer rask tørketid etter vask eller eksponering for elementene.',
        products: ['Utekos Mikrofiber™']
      }
    ]
  },
  {
    groupTitle: 'Comfyrobe™',
    technologies: [
      {
        icon: 'droplet',
        title: 'HydroGuard™ Shell (8000mm)',
        iconColor: 'text-teal-600',
        content:
          'Et høytpresterende 130 GSM polyester-skall laminert med en pustende PU-membran. Med vannsøyle på 8000mm leverer Comfyrobe™ fullstendig værbeskyttelse mot kraftig regn og vind, samtidig som membranen slipper ut overskuddsvarme (3000 g/m²/24t) for å forhindre klamhet.',
        products: ['Comfyrobe™']
      },
      {
        icon: 'sun',
        title: 'SherpaCore™ Thermal Lining',
        iconColor: 'text-teal-600',
        content:
          'Innvendig fôret med 250 GSM Sherpa Fleece av høy kvalitet. Materialet er antipeeling-behandlet for varig slitestyrke og mykhet. Konstruksjonen gir umiddelbar varme og absorberer restfuktighet fra huden, noe som gjør den ideell etter isbad eller vannsport.',
        products: ['Comfyrobe™']
      },
      {
        icon: 'zap',
        title: 'Teknisk konstruksjon',
        iconColor: 'text-teal-600',
        content:
          'Designet for funksjon. Inkluderer to-veis YKK®-glidelås for enkel betjening, 8 000 mm vannsøyle og refleksdetaljer for synlighet. Ermekantene har justerbare borrelåsstropper for å forsegle varmen eller tilpasse seg hansker. Splitt i sidene sikrer uhindret mobilitet.',
        products: ['Comfyrobe™']
      }
    ]
  },
  {
    groupTitle: 'Konstruksjon og funksjonalitet',
    technologies: [
      {
        icon: 'maximize-2',
        title: '3-i-1 adaptiv funksjonalitet',
        iconColor: 'text-violet-500',
        content:
          'Adaptivt design som omdefinerer bruksområdet. Gjennom et integrert system av snorstrammere transformeres plagget sømløst mellom tre moduser: "Fullengde" for maksimal stasjonær isolasjon, "Oppjustert" for umiddelbar mobilitet og "Parkas" for aktiv bevegelse og estetisk silhuett over lengre distanser.',
        products: ['Utekos TechDown™', 'Utekos Dun™', 'Utekos Mikrofiber™']
      },
      {
        icon: 'layers',
        title: 'YKK® Dual V-Zip™ System',
        iconColor: 'text-violet-500',
        content:
          'Innovativt to-spors glidelåssystem med omvendt V-profil. Teknologien muliggjør direkte tilgang til innvendige justeringsmekanismer og gir mulighet for strategisk ventilasjon uten å eksponere brystpartiet for kulde. Eliminerer behovet for å åpne hele fronten for å justere passform.',
        products: ['Utekos TechDown™', 'Utekos Dun™', 'Utekos Mikrofiber™']
      },
      {
        icon: 'shirt', // Using generalized icon here, assuming 'shirt' or similar fits, or reuse layers
        title: 'Taffeta innerfôr',
        iconColor: 'text-violet-500',
        content:
          'Valgt for minimal friksjon og maksimal komfort. Nylon Taffeta-fôret har en silkemyk overflate som glir uanstrengt over andre kleslag, noe som sikrer bevegelsesfrihet uten motstand. Materialet føles behagelig direkte mot huden og bidrar til produktets lave totalvekt.',
        products: ['Utekos TechDown™', 'Utekos Dun™', 'Utekos Mikrofiber™']
      }
    ]
  }
]
