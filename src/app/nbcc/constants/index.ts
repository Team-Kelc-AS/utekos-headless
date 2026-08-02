import type {
  NbccAiSummaryIntent,
  NbccAiSummaryPayload
} from '../types'

export const NBCC_LOGIN_URL =
  'https://gnist.styreweb.com/Account/Login?ReturnUrl=%2F'
export const MINIMUM_THINKING_TIME_MS = 2500
export const SITE_URL = 'https://utekos.no'
export const NBCC_URL = `${SITE_URL}/nbcc`
export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`
export const NBCC_AI_MODEL =
  process.env.NBCC_AI_SUMMARY_MODEL?.trim() ||
  'anthropic/claude-haiku-4.5'
export const NBCC_AI_MODEL_FALLBACK =
  process.env.NBCC_AI_SUMMARY_FALLBACK_MODEL?.trim() ||
  'google/gemini-2.5-pro'

export const NBCC_AI_SUMMARIES_CACHE_KEY = 'nbcc-ai-summary:v6'
export const NBCC_AI_SUMMARIES_CACHE_REVALIDATE_SECONDS = 3600
export const NBCC_AI_SUMMARIES_TAG_PREFIX = 'nbcc-ai-summary-v6-'

export const FALLBACK_SUMMARIES: Record<
  NbccAiSummaryIntent,
  NbccAiSummaryPayload
> = {
  'how-to-use': {
    kicker: 'Medlemsfordel',
    title: 'Slik bruker du NBCC-fordelen',
    intro:
      'Som samarbeidspartner med NBCC gleder vi oss over å kunne tilby deg en hyggelig medlemsrabatt. Det er vår måte å bidra til at de gode øyeblikkene ute kan bli enda litt lunere, mer komfortable og vare enda lenger.',
    sections: [
      {
        title: 'Støtt din lokalavdeling',
        style: 'paragraph',
        body: 'Et lite tips før du bestiller: Sjekk gjerne om lokalavdelingen din har en egen avtale med Utekos. Da anbefaler vi at du bruker deres dedikerte rabattkode. Prisen for deg blir akkurat den samme, samtidig som du støtter det viktige sosiale arbeidet i ditt nærområde.'
      },
      {
        title: 'Hvor finner jeg koden?',
        style: 'paragraph',
        body: 'Du finner rabattkoden din ved å logge inn på Min Side hos NBCC, eller under medlemsfordelene dine i Gnist-appen.'
      },
      {
        title: 'Slik bruker du fordelen din',
        style: 'steps',
        items: [
          'Hent rabattkoden din via Min Side hos NBCC eller Gnist-appen.',
          'Legg Utekos-favorittene dine i handlekurven her hos oss.',
          'Gå til kassen og skriv inn koden i rabattfeltet.',
          'Medlemsrabatten trekkes fra automatisk før du betaler.'
        ]
      }
    ]
  },
  'sizes': {
    kicker: 'Størrelseshjelp',
    title: 'Finn din størrelse',
    intro:
      'Det er enklere enn du tror! Utekos er skapt for å være romslig, lunt og behagelig – du skal jo tross alt slappe av. Fordi plaggene våre har en raus unisex-passform, trenger du ikke finregne på centimeterne. Kjernekonseptet er at plagget skal kunne justeres og tilpasses etter personlig behov.',
    sections: [
      {
        title: 'Utekos TechDown™',
        style: 'list',
        body: 'TechDown™ har en lun og mer kroppsnær passform enn de mest oversized modellene, men er fortsatt laget for komfort, bevegelse og justering.',
        items: [
          'Liten: total lengde fra nakke til bunn er 152 cm. Passer best for deg som ønsker en kortere og nettere variant.',
          'Middels: total lengde er 162 cm. Passer best for deg som er 170–180 cm. Er du lavere enn 170 cm, får du en romsligere passform.',
          'Stor: total lengde er 166 cm. Passer best for deg som er 180–195 cm, eller for deg som er lavere og ønsker mer romslighet.',
          'Ekstra Stor: passer best for deg som er 190 cm og oppover, eller for deg som ønsker maksimal romslighet, lengde i kroppen og ekstra plass i ermene.'
        ]
      },
      {
        title: 'Utekos Mikrofiber™',
        style: 'list',
        body: 'Mikrofiber™ er lett, lun og enkel å tilpasse med snorstramming. Her er total lengde ofte det mest nyttige målet å starte med.',
        items: [
          'Medium: total lengde fra nakke til bunn er 170 cm. Passer godt opptil ca. 180 cm, særlig hvis du bruker plagget over lettere klær.',
          'Large: total lengde er 200 cm. Passer godt over 180 cm, eller hvis du ønsker mer plass til tykkere lag og ekstra lunhet.'
        ]
      },
      {
        title: 'Comfyrobe™',
        style: 'list',
        body: 'Comfyrobe™ er designet som ditt personlige, beskyttende skall mot vær og vind. Den har en romslig, rektangulær og omsluttende passform, med forlenget rygg, splitter i sidene for bevegelsesfrihet og justerbare ermer som ikke skal være i veien.',
        items: [
          'S: total lengde fra skulder og ned er 97 cm. Et godt valg hvis du vil ha en romslig robe som fortsatt føles lett å håndtere.',
          'L: total lengde er 113 cm. Velg denne hvis du ønsker mest dekning, mer lengde og god plass over klær.'
        ]
      }
    ]
  }
}
