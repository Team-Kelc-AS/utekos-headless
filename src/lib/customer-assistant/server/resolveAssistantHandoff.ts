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
    /\b(?:reklamere|reklamasjon(?:en)?|klage(?:n)?|skade(?:t|de)?|ødelagt|defekt(?:e)?|produksjonsfeil)\b/u
  ]
]

const rawEmailPattern =
  /(?<![\p{L}\p{N}._%+-])[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+(?![\p{L}\p{N}._%+-])/u

const formattedPhoneCandidatePattern =
  /(?<!\d)(?:(?:\+|00)47[\s.-]?)?(?:\d{3}[\s.-]\d{2}[\s.-]\d{3}|\d{2}(?:[\s.-]\d{2}){3})(?!\d)/gu

const concreteOrderTokenPattern =
  /(?<![\p{L}\p{N}])(?:#\d{5,}|ute-\d{5,})(?![\p{L}\p{N}])/gu

const paymentNumberCandidatePattern =
  /(?<![\p{L}\p{N}])(?:\d[\s-]?){12,18}\d(?![\p{L}\p{N}])/gu

const productNumberLabelBeforeCandidatePattern =
  /\b(?:produktnummer|varenummer|artikkelnummer|sku|modellnummer|variantnummer)\b(?:\s+er)?[\s:#-]*$/u

const productNumberLabelAfterCandidatePattern =
  /^[\s:#-]*(?:produktnummer|varenummer|artikkelnummer|sku|modellnummer|variantnummer)\b/u

const labeledPersonalSharingPattern =
  /\b(?:telefonnummer(?:et)?|e-post(?:adresse(?:n)?)?|epost(?:adresse(?:n)?)?|adresse(?:n)?|fødselsnummer|personnummer)\b(?:\s+(?:er|:))?\s+(?:min|mitt|mine)\b|\b(?:min|mitt|mine)\s+(?:telefonnummer(?:et)?|e-post(?:adresse(?:n)?)?|epost(?:adresse(?:n)?)?|adresse(?:n)?|fødselsnummer|personnummer)\b/u

const directPersonalSharingPattern =
  /\b(?:(?:du\s+kan|kan\s+du)\s+)?(?:kontakte|kontakt|ringe|ring|sende|send)\s+meg(?:\s+(?:telefonnummer(?:et)?|e-post(?:adresse(?:n)?)?|epost(?:adresse(?:n)?)))?\s+(?:på|via|til)\s+(?:\d{8}|\d{3}\s\d{2}\s\d{3}|[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+)\b/u

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

function hasNearbyProductIdentifierLabel(
  text: string,
  matchIndex: number,
  matchLength: number
) {
  const prefix = text.slice(
    Math.max(0, matchIndex - 48),
    matchIndex
  )
  const suffix = text.slice(
    matchIndex + matchLength,
    matchIndex + matchLength + 48
  )

  return (
    productNumberLabelBeforeCandidatePattern.test(prefix) ||
    productNumberLabelAfterCandidatePattern.test(suffix)
  )
}

function containsFormattedPhone(text: string) {
  for (const match of text.matchAll(
    formattedPhoneCandidatePattern
  )) {
    const matchIndex = match.index ?? 0

    if (
      !hasNearbyProductIdentifierLabel(
        text,
        matchIndex,
        match[0].length
      )
    ) {
      return true
    }
  }

  return false
}

function containsConcreteOrderToken(text: string) {
  for (const match of text.matchAll(concreteOrderTokenPattern)) {
    const matchIndex = match.index ?? 0

    if (
      !hasNearbyProductIdentifierLabel(
        text,
        matchIndex,
        match[0].length
      )
    ) {
      return true
    }
  }

  return false
}

function containsPaymentNumber(text: string) {
  for (const match of text.matchAll(
    paymentNumberCandidatePattern
  )) {
    const digits = match[0].replace(/\D/gu, '')
    if (digits.length < 13 || digits.length > 19) continue

    const matchIndex = match.index ?? 0
    if (
      hasNearbyProductIdentifierLabel(
        text,
        matchIndex,
        match[0].length
      )
    ) {
      continue
    }

    if (passesLuhnCheck(digits)) return true
  }

  return false
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

  if (containsConcreteOrderToken(normalizedText)) {
    return 'order'
  }

  if (
    rawEmailPattern.test(normalizedText) ||
    containsFormattedPhone(normalizedText) ||
    containsPaymentNumber(normalizedText) ||
    labeledPersonalSharingPattern.test(normalizedText) ||
    directPersonalSharingPattern.test(normalizedText)
  ) {
    return 'personal_data'
  }

  return failureCount >= 2 ? 'repeated_failure' : null
}
