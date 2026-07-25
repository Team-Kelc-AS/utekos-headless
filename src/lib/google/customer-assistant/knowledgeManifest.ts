import { createHash } from 'node:crypto'
import { COMFYROBE_LANDING_FAQ } from '@/app/comfyrobe/data/comfyrobeLandingSeo'
import { shippingReturnsFaqItems } from '@/app/frakt-og-retur/data/shippingReturnsContent'
import {
  comparisonRows,
  modelRecommendations
} from '@/app/handlehjelp/sammenlign-modeller/utils/comparisonData'

export type AssistantKnowledgeDocument = {
  id: string
  title: string
  canonicalUrl: `https://utekos.no/${string}`
  locale: 'nb-NO'
  contentType:
    | 'product_advice'
    | 'size'
    | 'shipping_returns'
    | 'materials'
    | 'care'
    | 'contact'
  lastReviewed: '2026-07-24'
  content: string
  checksum: string
  published: true
}

type AssistantKnowledgeDraft = Omit<
  AssistantKnowledgeDocument,
  'checksum'
>

const REVIEW_DATE = '2026-07-24' as const
const MAX_CONTENT_LENGTH = 20_000
const SHA_256_PATTERN = /^[a-f0-9]{64}$/u
const MODEL_KEYS = [
  'utekos-dun',
  'utekos-mikrofiber',
  'utekos-techdown'
] as const

const canonicalDocuments = [
  {
    id: 'compare-models',
    canonicalUrl:
      'https://utekos.no/handlehjelp/sammenlign-modeller',
    contentType: 'product_advice'
  },
  {
    id: 'comfyrobe-faq',
    canonicalUrl: 'https://utekos.no/comfyrobe',
    contentType: 'product_advice'
  },
  {
    id: 'shipping-returns',
    canonicalUrl: 'https://utekos.no/frakt-og-retur',
    contentType: 'shipping_returns'
  },
  {
    id: 'size-guide',
    canonicalUrl:
      'https://utekos.no/handlehjelp/storrelsesguide',
    contentType: 'size'
  },
  {
    id: 'materials',
    canonicalUrl:
      'https://utekos.no/handlehjelp/teknologi-materialer',
    contentType: 'materials'
  },
  {
    id: 'care',
    canonicalUrl:
      'https://utekos.no/handlehjelp/vask-og-vedlikehold',
    contentType: 'care'
  },
  {
    id: 'contact',
    canonicalUrl: 'https://utekos.no/kontaktskjema',
    contentType: 'contact'
  }
] as const

function formatQuestionAnswers(
  items: ReadonlyArray<{
    readonly question: string
    readonly answer: string
  }>
) {
  return items
    .map(
      item => `Spørsmål: ${item.question}\nSvar: ${item.answer}`
    )
    .join('\n\n')
}

function buildModelComparisonContent() {
  const recommendations = modelRecommendations
    .map(model =>
      [
        `## ${model.name}`,
        `Best for: ${model.bestFor}`,
        model.description.trim(),
        `Fordeler: ${model.proofPoints.join('; ')}`,
        `Produktside: https://utekos.no${model.href}`
      ].join('\n')
    )
    .join('\n\n')

  const comparison = comparisonRows
    .map(row => {
      const values = MODEL_KEYS.map(key => {
        const value = row.values[key]
        const renderedValue =
          typeof value === 'boolean' ?
            value ? 'Ja'
            : 'Nei'
          : value

        return `${modelRecommendations.find(model => model.key === key)?.name ?? key}: ${renderedValue}`
      })

      return [
        `## ${row.feature}`,
        row.shortAnswer,
        ...values
      ].join('\n')
    })
    .join('\n\n')

  return `# Sammenlign Utekos-modellene\n\n${recommendations}\n\n${comparison}`
}

function buildKnowledgeDrafts(): AssistantKnowledgeDraft[] {
  return [
    {
      ...canonicalDocuments[0],
      title: 'Sammenlign Utekos-modellene',
      locale: 'nb-NO',
      lastReviewed: REVIEW_DATE,
      content: buildModelComparisonContent(),
      published: true
    },
    {
      ...canonicalDocuments[1],
      title: 'Comfyrobe – vanlige spørsmål',
      locale: 'nb-NO',
      lastReviewed: REVIEW_DATE,
      content: `# Comfyrobe – vanlige spørsmål\n\n${formatQuestionAnswers(COMFYROBE_LANDING_FAQ)}\n\nLes mer: https://utekos.no/comfyrobe`,
      published: true
    },
    {
      ...canonicalDocuments[2],
      title: 'Frakt og retur',
      locale: 'nb-NO',
      lastReviewed: REVIEW_DATE,
      content: `# Frakt og retur\n\n${formatQuestionAnswers(shippingReturnsFaqItems)}\n\nFull informasjon: https://utekos.no/frakt-og-retur`,
      published: true
    },
    {
      ...canonicalDocuments[3],
      title: 'Størrelsesguide',
      locale: 'nb-NO',
      lastReviewed: REVIEW_DATE,
      content: `# Størrelsesguide

Bruk målene for det aktuelle produktet som veiledning, og sammenlign gjerne med et lignende plagg du har hjemme. Utekos Dun og Utekos Mikrofiber vises i Medium og Large, mens Utekos TechDown vises i Liten, Middels og Stor. Comfyrobe vises i Small, Medium og Large og er laget med en romslig unisex-passform.

Velg normalt den størrelsen du vanligvis bruker når du ønsker en romslig passform. Vurder å gå opp dersom du ønsker ekstra plass til tykke lag eller en bevisst overdimensjonert passform. Størrelsesguiden er veiledende og kan ikke garantere passform.

Se alle aktuelle produktmål: https://utekos.no/handlehjelp/storrelsesguide`,
      published: true
    },
    {
      ...canonicalDocuments[4],
      title: 'Teknologi og materialer',
      locale: 'nb-NO',
      lastReviewed: REVIEW_DATE,
      content: `# Teknologi og materialer

Utekos TechDown bruker CloudWeave, en syntetisk isolasjon utviklet for dunlignende loft og kompresjon, og et vannavvisende nylonskall. Utekos Dun bruker dun med fillpower 650 og et lett nylonstoff med DWR-behandling. Utekos Mikrofiber bruker hurtigtørkende syntetisk mikrofiber og et 20D/380T nylonstoff som er vindtett og sterkt vannavvisende.

Comfyrobe har et 130 GSM polyesterskall med pustende PU-membran, tapede sømmer og oppgitt vannsøyle på 8 000 mm. Innsiden har 250 GSM Sherpa Fleece. Utekos Dun, Mikrofiber og TechDown har justering mellom fullengde, oppjustert og parkas, samt et to-spors glidelåssystem.

Les full materialbeskrivelse: https://utekos.no/handlehjelp/teknologi-materialer`,
      published: true
    },
    {
      ...canonicalDocuments[5],
      title: 'Vask og vedlikehold',
      locale: 'nb-NO',
      lastReviewed: REVIEW_DATE,
      content: `# Vask og vedlikehold

Luft plagget mellom bruk og vask først når det faktisk er skittent. Før vask: lukk glidelåser, fest borrelås, tøm lommer og vreng plagget. Bruk et skånsomt program, kaldt eller lunkent vann og mildt vaskemiddel. Unngå tøymykner og blekemidler.

Utekos Dun vaskes på maksimalt 30 °C med mildt dunmiddel. Tørk på lav varme med tørkeballer, rist ut klumper underveis og sørg for at plagget er helt gjennomtørt. Utekos Mikrofiber vaskes på maksimalt 30 °C og lufttørkes på henger; unngå tørketrommel. Oppbevar plagg på en stødig henger i et tørt, luftig skap og unngå langvarig kompresjon.

Les de produktspesifikke rådene: https://utekos.no/handlehjelp/vask-og-vedlikehold`,
      published: true
    },
    {
      ...canonicalDocuments[6],
      title: 'Kontakt Utekos kundeservice',
      locale: 'nb-NO',
      lastReviewed: REVIEW_DATE,
      content: `# Kontakt Utekos kundeservice

Bruk kontaktskjemaet på https://utekos.no/kontaktskjema, send e-post til kundeservice@utekos.no eller ring +47 402 16 343.

Kjøpshjelpen kan ikke slå opp ordre, betalinger, returer eller reklamasjoner. Slike saker overføres trygt til kundeservice. Ikke del sensitive opplysninger i chatten; bruk en av kontaktkanalene når kundeservice trenger opplysninger for å behandle saken.`,
      published: true
    }
  ]
}

/**
 * Checksum input is title, canonical URL, and content in that order. Each
 * value is Unicode NFC-normalized, line endings become LF, trailing line
 * whitespace is removed, and outer whitespace is trimmed before LF joining.
 */
export function normalizeAssistantKnowledgeChecksumInput({
  title,
  canonicalUrl,
  content
}: Pick<
  AssistantKnowledgeDocument,
  'title' | 'canonicalUrl' | 'content'
>) {
  return [title, canonicalUrl, content]
    .map(value =>
      value
        .normalize('NFC')
        .replace(/\r\n?/gu, '\n')
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n')
        .trim()
    )
    .join('\n')
}

export function computeAssistantKnowledgeChecksum(
  document: Pick<
    AssistantKnowledgeDocument,
    'title' | 'canonicalUrl' | 'content'
  >
) {
  return createHash('sha256')
    .update(
      normalizeAssistantKnowledgeChecksumInput(document),
      'utf8'
    )
    .digest('hex')
}

export function validateAssistantKnowledgeDocuments(
  documents: readonly AssistantKnowledgeDocument[]
) {
  if (documents.length !== canonicalDocuments.length) {
    throw new Error(
      'Assistant knowledge must contain exactly 7 documents'
    )
  }

  const ids = new Set<string>()
  const urls = new Set<string>()

  for (const [index, document] of documents.entries()) {
    if (ids.has(document.id)) {
      throw new Error(
        `Assistant knowledge has duplicate document ID: ${document.id}`
      )
    }
    ids.add(document.id)

    if (urls.has(document.canonicalUrl)) {
      throw new Error(
        `Assistant knowledge has duplicate canonical URL: ${document.canonicalUrl}`
      )
    }
    urls.add(document.canonicalUrl)

    let url: URL
    try {
      url = new URL(document.canonicalUrl)
    } catch {
      throw new Error(
        `Document ${document.id} must use a canonical Utekos URL`
      )
    }

    if (
      url.origin !== 'https://utekos.no' ||
      !document.canonicalUrl.startsWith('https://utekos.no/')
    ) {
      throw new Error(
        `Document ${document.id} must use a canonical Utekos URL`
      )
    }

    if (!document.title.trim()) {
      throw new Error(
        `Document ${document.id} has a blank title`
      )
    }
    if (!document.content.trim()) {
      throw new Error(
        `Document ${document.id} has blank content`
      )
    }
    if (document.content.length > MAX_CONTENT_LENGTH) {
      throw new Error(
        `Document ${document.id} exceeds 20,000 characters`
      )
    }
    if (document.locale !== 'nb-NO') {
      throw new Error(
        `Document ${document.id} must use locale nb-NO`
      )
    }
    if (document.lastReviewed !== REVIEW_DATE) {
      throw new Error(
        `Document ${document.id} has an invalid lastReviewed value`
      )
    }
    if (document.published !== true) {
      throw new Error(
        `Document ${document.id} must be published`
      )
    }
    if (!SHA_256_PATTERN.test(document.checksum)) {
      throw new Error(
        `Document ${document.id} must have a valid SHA-256 checksum`
      )
    }
    if (
      document.checksum !==
      computeAssistantKnowledgeChecksum(document)
    ) {
      throw new Error(
        `Document ${document.id} checksum does not match its content`
      )
    }

    const canonical = canonicalDocuments[index]
    if (
      !canonical ||
      document.id !== canonical.id ||
      document.canonicalUrl !== canonical.canonicalUrl ||
      document.contentType !== canonical.contentType
    ) {
      throw new Error(
        `Assistant knowledge has the wrong canonical document at position ${index + 1}`
      )
    }
  }

  return documents
}

export function buildAssistantKnowledgeDocuments(): AssistantKnowledgeDocument[] {
  const documents = buildKnowledgeDrafts().map(document => ({
    ...document,
    checksum: computeAssistantKnowledgeChecksum(document)
  }))

  validateAssistantKnowledgeDocuments(documents)
  return documents
}
