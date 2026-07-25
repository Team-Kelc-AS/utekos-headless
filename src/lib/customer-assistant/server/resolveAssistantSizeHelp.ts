import {
  comfyrobeData,
  techDownData,
  utekosData
} from '@/app/handlehjelp/storrelsesguide/utils/data'
import type { AssistantChatRequest } from '../assistantProtocol'
import { normalizeAssistantText } from '../assistantProductProfiles'

type SizeFamily = 'comfyrobe' | 'techdown' | 'utekos'

export type AssistantSizeHelpResult = {
  kind: 'answer' | 'clarify'
  text: string
}

const roomyPattern =
  /\b(?:romslig|oversized|overdimensjonert|tykke?\s+lag|boblejakke|ekstra\s+plass|maksimal\s+(?:plass|dekning))\b/u
const closerPattern =
  /\b(?:tettere|kroppsnær|nettere|normal|balansert|uten\s+ekstra)\b/u

function userTexts(request: AssistantChatRequest) {
  return request.messages
    .filter(message => message.role === 'user')
    .map(message =>
      normalizeAssistantText(
        message.parts.map(part => part.text).join(' ')
      )
    )
}

function familyFromText(text: string): SizeFamily | null {
  const matches = [
    /\bcomfy\s*robe\b/u.test(text) ? 'comfyrobe' : null,
    /\btech\s*down\b/u.test(text) ? 'techdown' : null,
    /\b(?:utekos\s+)?(?:dun|mikrofiber)\b/u.test(text) ? 'utekos'
    : null
  ].filter((family): family is SizeFamily => family !== null)

  return new Set(matches).size === 1 ?
      (matches[0] ?? null)
    : null
}

function resolveSizeFamily(
  request: AssistantChatRequest
): SizeFamily | null {
  for (const text of userTexts(request).toReversed()) {
    const family = familyFromText(text)
    if (family) return family
  }

  if (request.pageContext.productHandle === 'comfyrobe') {
    return 'comfyrobe'
  }
  if (request.pageContext.productHandle === 'utekos-techdown') {
    return 'techdown'
  }
  if (
    request.pageContext.productHandle === 'utekos-dun' ||
    request.pageContext.productHandle === 'utekos-mikrofiber'
  ) {
    return 'utekos'
  }

  return null
}

function resolveHeight(texts: readonly string[]) {
  for (const text of texts.toReversed()) {
    const match = text.match(
      /(?<!\d)(1[4-9]\d|20\d|21\d|220)\s*(?:cm|centimeter)?(?!\d)/u
    )
    if (match?.[1]) return Number(match[1])
  }

  return null
}

function resolveFit(texts: readonly string[]) {
  for (const text of texts.toReversed()) {
    const roomy = roomyPattern.test(text)
    const closer = closerPattern.test(text)

    if (roomy !== closer) return roomy ? 'roomy' : 'closer'
  }

  return null
}

function resolveUsualComfyrobeSize(texts: readonly string[]) {
  const patterns = [
    {
      size: 'XS' as const,
      pattern: /\b(?:xs|extra\s*small|small|s)\b/u
    },
    { size: 'M' as const, pattern: /\b(?:medium|middels|m)\b/u },
    {
      size: 'XL' as const,
      pattern: /\b(?:xl|extra\s*large|large|l)\b/u
    }
  ]

  for (const text of texts.toReversed()) {
    const matches = patterns.filter(({ pattern }) =>
      pattern.test(text)
    )
    if (matches.length === 1) return matches[0]?.size ?? null
  }

  return null
}

function measurement(
  rows: readonly object[],
  label: string,
  key: string
) {
  const row = rows.find(
    candidate =>
      'measurement' in candidate &&
      candidate.measurement === label
  ) as Record<string, unknown> | undefined
  const value = row?.[key]

  return typeof value === 'string' ? value : null
}

function answerTechDown(
  height: number,
  fit: 'closer' | 'roomy'
) {
  const base =
    height <= 170 ? 'small'
    : height <= 180 ? 'medium'
    : 'large'
  const size =
    fit === 'roomy' && base === 'small' ? 'medium'
    : fit === 'roomy' && base === 'medium' ? 'large'
    : base
  const details = {
    small: { label: 'Liten (S)', key: 'liten' },
    medium: { label: 'Medium (M)', key: 'middels' },
    large: { label: 'Large (L)', key: 'stor' }
  } as const
  const selected = details[size]
  const length = measurement(
    techDownData,
    'Total lengde (nakke til bunn)',
    selected.key
  )

  if (height > 195) {
    return 'Størrelsesguiden opplyser at den største TechDown-størrelsen kan bli for liten over ca. 195 cm. Sammenlign derfor produktmålene med et plagg du har hjemme, eller be kundeservice vurdere målene sammen med deg.'
  }

  return `Ut fra høyden og ønsket passform er ${selected.label} et naturlig utgangspunkt for TechDown. Guidens totale lengde for denne størrelsen er ${length ?? 'oppgitt i måletabellen'}. Sammenlign målene med et lignende plagg hjemme før du bestemmer deg; dette er veiledning, ikke en garanti for passform.`
}

function answerUtekos(height: number, fit: 'closer' | 'roomy') {
  const size = height > 180 || fit === 'roomy' ? 'L' : 'M'
  const key = size === 'M' ? 'm' : 'l'
  const length = measurement(
    utekosData,
    'Total lengde (nakke til bunn)',
    key
  )

  return `Ut fra størrelsesguiden er ${size === 'M' ? 'Medium' : 'Large'} et naturlig utgangspunkt for Utekos Dun og Mikrofiber. ${size === 'M' ? 'Medium anbefales normalt opptil ca. 180 cm når du ønsker en romslig, men tettere passform.' : 'Large anbefales over ca. 180 cm eller når du ønsker ekstra plass til tykke lag.'} Guidens totale lengde er ${length ?? 'oppgitt i måletabellen'}. Sammenlign målene med et lignende plagg hjemme; dette er veiledning, ikke en garanti.`
}

function answerComfyrobe(
  usualSize: 'M' | 'XL' | 'XS',
  fit: 'closer' | 'roomy'
) {
  const order = ['XS', 'M', 'XL'] as const
  const baseIndex = order.indexOf(usualSize)
  const size =
    fit === 'roomy' ?
      (order[Math.min(baseIndex + 1, order.length - 1)] ??
      usualSize)
    : usualSize
  const details = {
    XS: { key: 'xs', usual: 'small' },
    M: { key: 'ml', usual: 'medium' },
    XL: { key: 'lxl', usual: 'large' }
  } as const
  const selected = details[size]
  const length = measurement(
    comfyrobeData,
    'Total lengde (fra HSP til front)',
    selected.key
  )
  const width = measurement(
    comfyrobeData,
    'Bredde over bryst',
    selected.key
  )

  return `Comfyrobe har en bevisst romslig unisex-passform. Ut fra vanlig størrelse og ønsket passform er ${size} et naturlig utgangspunkt. Guiden oppgir ${length ?? 'målt lengde i tabellen'} total lengde og ${width ?? 'målt brystbredde i tabellen'} brystbredde for dette alternativet. Sammenlign med et plagg du liker passformen på; dette er veiledning, ikke en garanti.`
}

export function resolveAssistantSizeHelp(
  request: AssistantChatRequest
): AssistantSizeHelpResult {
  const family = resolveSizeFamily(request)
  const texts = userTexts(request)

  if (!family) {
    return {
      kind: 'clarify',
      text: 'Hvilket produkt gjelder det: Utekos Dun eller Mikrofiber, Utekos TechDown eller Comfyrobe?'
    }
  }

  const fit = resolveFit(texts)

  if (family === 'comfyrobe') {
    const usualSize = resolveUsualComfyrobeSize(texts)
    if (!usualSize || !fit) {
      return {
        kind: 'clarify',
        text: 'Hvilken størrelse bruker du vanligvis, og ønsker du den mest balanserte passformen eller ekstra romslig dekning?'
      }
    }

    return {
      kind: 'answer',
      text: answerComfyrobe(usualSize, fit)
    }
  }

  const height = resolveHeight(texts)
  if (!height || !fit) {
    return {
      kind: 'clarify',
      text: 'Hvor høy er du i centimeter, og ønsker du en tettere passform eller ekstra rom til tykke lag?'
    }
  }

  return {
    kind: 'answer',
    text:
      family === 'techdown' ?
        answerTechDown(height, fit)
      : answerUtekos(height, fit)
  }
}
