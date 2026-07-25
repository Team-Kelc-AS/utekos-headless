import type { AssistantHandoff } from '../assistantProtocol'
import { normalizeAssistantText } from '../assistantProductProfiles'

const specificHandoffPatterns: ReadonlyArray<
  readonly [
    Extract<
      AssistantHandoff['reason'],
      'order' | 'payment' | 'complaint'
    >,
    RegExp
  ]
> = [
  [
    'order',
    /\b(?:ordre(?:n|r)?|ordrenummer(?:et)?|bestilling(?:en|er|ene|snummer(?:et)?)?|sporing(?:en)?|sporingsnummer(?:et)?)\b|\b(?:pakken?|sending(?:en)?|levering(?:en)?)\b.{0,40}\b(?:mangler|savnet|borte|ikke\s+(?:kommet|mottatt|ankommet))\b|\b(?:mangler|savner|ikke\s+(?:har\s+)?mottatt)\b.{0,40}\b(?:pakken?|sending(?:en)?|levering(?:en)?)\b/u
  ],
  [
    'payment',
    /\b(?:betaling(?:en|er)?|klarna|faktura(?:en)?|kort(?:et)?\s+(?:mitt\s+)?(?:blir|ble|er)\s+(?:avvist|avslått)|får\s+ikke\s+betalt)\b/u
  ],
  [
    'complaint',
    /(?<![\p{L}\p{N}])(?:reklamere|reklamasjon(?:en)?|klage(?:n)?|skade(?:t|de)?|ødelagt(?:e)?|defekt(?:e)?|produksjonsfeil)(?![\p{L}\p{N}])/u
  ]
]

const rawEmailPattern =
  /(?<![\p{L}\p{N}._%+-])[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+(?![\p{L}\p{N}._%+-])/u

const formattedPhoneCandidatePattern =
  /(?<!\p{N})(?:(?:\+47|0047)[\s.-]?(?:[0-9]{8}|[0-9]{3}[\s.-][0-9]{2}[\s.-][0-9]{3}|[0-9]{2}(?:[\s.-][0-9]{2}){3})|[0-9]{3}[\s.-][0-9]{2}[\s.-][0-9]{3}|[0-9]{2}(?:[\s.-][0-9]{2}){3})(?!\p{N})/gu

const concreteOrderTokenPattern =
  /(?<![\p{L}\p{N}])(?:#\d{5,}|ute-\d{5,})(?![\p{L}\p{N}])/gu

const paymentNumberCandidatePattern =
  /(?<![\p{L}\p{N}])(?:\d[\s-]?){12,18}\d(?![\p{L}\p{N}])/gu

const productIdentifierLabelPattern =
  /(?<![\p{L}\p{N}])(?:produktnummer(?:et)?|varenummer(?:et)?|artikkelnummer(?:et)?|sku(?:-en)?|modellnummer(?:et)?|variantnummer(?:et)?)(?![\p{L}\p{N}])/gu

const labeledPersonalSharingPattern =
  /\b(?:telefonnummer(?:et)?|e-post(?:adresse(?:n)?)?|epost(?:adresse(?:n)?)?|adresse(?:n)?|fødselsnummer|personnummer)\b(?:\s+(?:er|:))?\s+(?:min|mitt|mine)\b|\b(?:min|mitt|mine)\s+(?:telefonnummer(?:et)?|e-post(?:adresse(?:n)?)?|epost(?:adresse(?:n)?)?|adresse(?:n)?|fødselsnummer|personnummer)\b/u

const directPersonalSharingPattern =
  /\b(?:(?:du\s+kan|kan\s+du)\s+)?(?:kontakte|kontakt|ringe|ring|sende|send)\s+meg(?:\s+(?:telefonnummer(?:et)?|e-post(?:adresse(?:n)?)?|epost(?:adresse(?:n)?)))?\s+(?:på|via|til)\s+(?:\d{8}|\d{3}\s\d{2}\s\d{3}|[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+)\b/u

const explicitHumanHandoffPattern =
  /\b(?:kundeservice|menneskelig\s+(?:hjelp|kundeservice)|snakke\s+med\s+(?:en\s+)?(?:person|medarbeider)|snakke\s+med\s+et\s+menneske)\b/u

function passesLuhnCheck(value: string) {
  let sum = 0
  let doubleDigit = false

  for (let index = value.length - 1; index >= 0; index -= 1) {
    const digit = Number(value[index])
    let contribution = digit

    if (doubleDigit) {
      contribution *= 2
      if (contribution > 9) contribution -= 9
    }

    sum += contribution
    doubleDigit = !doubleDigit
  }

  return sum % 10 === 0
}

type RestrictedCandidate = {
  kind: 'order' | 'phone' | 'payment'
  start: number
  end: number
}

type ProductIdentifierLabel = { start: number; end: number }

function collectPatternCandidates(
  text: string,
  pattern: RegExp,
  kind: RestrictedCandidate['kind']
): RestrictedCandidate[] {
  return [...text.matchAll(pattern)].map(match => {
    const start = match.index ?? 0

    return { kind, start, end: start + match[0].length }
  })
}

function collectRestrictedCandidates(
  text: string
): RestrictedCandidate[] {
  const paymentCandidates = [
    ...text.matchAll(paymentNumberCandidatePattern)
  ].flatMap(match => {
    const digits = match[0].replace(/[^0-9]/gu, '')

    if (
      digits.length < 13 ||
      digits.length > 19 ||
      !passesLuhnCheck(digits)
    ) {
      return []
    }

    const start = match.index ?? 0
    return [
      {
        kind: 'payment' as const,
        start,
        end: start + match[0].length
      }
    ]
  })

  return [
    ...collectPatternCandidates(
      text,
      concreteOrderTokenPattern,
      'order'
    ),
    ...collectPatternCandidates(
      text,
      formattedPhoneCandidatePattern,
      'phone'
    ),
    ...paymentCandidates
  ].toSorted((left, right) => left.start - right.start)
}

function isBoundedProductLabelConnector(connector: string) {
  return (
    connector.length <= 48 &&
    /^(?:[\s,:=()#-]*|[\s,:=()#-]*\ber\b[\s,:=()#-]*)$/u.test(
      connector
    )
  )
}

function isParenthesizedRange(
  text: string,
  start: number,
  end: number
) {
  return (
    /\(\s*$/u.test(text.slice(0, start)) &&
    /^\s*\)/u.test(text.slice(end))
  )
}

function getProductLabelAssociationScore(
  text: string,
  label: ProductIdentifierLabel,
  candidate: RestrictedCandidate
) {
  const labelBeforeCandidate = label.end <= candidate.start
  const connector =
    labelBeforeCandidate ?
      text.slice(label.end, candidate.start)
    : text.slice(candidate.end, label.start)

  if (!isBoundedProductLabelConnector(connector)) {
    return null
  }

  const hasForwardConnector = /\ber\b|[=:]/u.test(connector)
  const labelIsParenthesized = isParenthesizedRange(
    text,
    label.start,
    label.end
  )
  const candidateIsParenthesized = isParenthesizedRange(
    text,
    candidate.start,
    candidate.end
  )
  const directionScore =
    labelBeforeCandidate && hasForwardConnector ? 0
    : !labelBeforeCandidate && labelIsParenthesized ? 0
    : labelBeforeCandidate && candidateIsParenthesized ? 0
    : labelBeforeCandidate && labelIsParenthesized ? 2
    : 1

  return directionScore * 100 + connector.length
}

function findProductLabeledCandidates(
  text: string,
  candidates: RestrictedCandidate[]
) {
  const labeledCandidates = new Set<RestrictedCandidate>()
  const labels = [
    ...text.matchAll(productIdentifierLabelPattern)
  ].map(match => {
    const start = match.index ?? 0

    return { start, end: start + match[0].length }
  })

  for (const label of labels) {
    const association = candidates
      .flatMap(candidate => {
        const score = getProductLabelAssociationScore(
          text,
          label,
          candidate
        )

        return score === null ? [] : [{ candidate, score }]
      })
      .toSorted(
        (left, right) =>
          left.score - right.score ||
          left.candidate.start - right.candidate.start
      )[0]

    if (association) {
      labeledCandidates.add(association.candidate)
    }
  }

  return labeledCandidates
}

export function resolveAssistantHandoff(
  text: string,
  failureCount: number
): AssistantHandoff['reason'] | null {
  const normalizedText = normalizeAssistantText(text)
  const matchedReason = specificHandoffPatterns.find(
    ([, pattern]) => pattern.test(normalizedText)
  )?.[0]

  if (matchedReason) {
    return matchedReason
  }

  if (explicitHumanHandoffPattern.test(normalizedText)) {
    return 'uncertain'
  }

  const restrictedCandidates =
    collectRestrictedCandidates(normalizedText)
  const productLabeledCandidates = findProductLabeledCandidates(
    normalizedText,
    restrictedCandidates
  )
  const containsUnlabeledCandidate = (
    ...kinds: RestrictedCandidate['kind'][]
  ) =>
    restrictedCandidates.some(
      candidate =>
        kinds.includes(candidate.kind) &&
        !productLabeledCandidates.has(candidate)
    )

  if (containsUnlabeledCandidate('order')) {
    return 'order'
  }

  if (
    rawEmailPattern.test(normalizedText) ||
    containsUnlabeledCandidate('phone', 'payment') ||
    labeledPersonalSharingPattern.test(normalizedText) ||
    directPersonalSharingPattern.test(normalizedText)
  ) {
    return 'personal_data'
  }

  return failureCount >= 2 ? 'repeated_failure' : null
}
