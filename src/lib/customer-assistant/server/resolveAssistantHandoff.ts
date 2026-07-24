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
    /\b(?:ordre(?:n|r)?|ordrenummer(?:et)?|sporing(?:en)?|sporingsnummer(?:et)?)\b/u
  ],
  ['payment', /\b(?:betaling(?:en)?|klarna|faktura(?:en)?)\b/u],
  [
    'complaint',
    /\b(?:reklamere|reklamasjon(?:en)?|klage(?:n)?)\b/u
  ]
]

const personalDataLabelPattern =
  /\b(?:telefonnummer(?:et)?|e-post(?:adresse(?:n)?)?|epost(?:adresse(?:n)?)?|adresse(?:n)?|fødselsnummer|personnummer)\b/u

const personalDataValuePattern =
  /\b(?:\d{8}|\d{3}\s\d{2}\s\d{3})\b|[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/u

const personalPossessivePattern = /\b(?:min|mitt|mine)\b/u

const personalContactActionPattern =
  /\b(?:kontakt\s+meg|nå\s+meg|send\s+meg|ring\s+meg)\b/u

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

  if (
    (personalDataLabelPattern.test(normalizedText) &&
      personalPossessivePattern.test(normalizedText)) ||
    (personalDataValuePattern.test(normalizedText) &&
      personalContactActionPattern.test(normalizedText))
  ) {
    return 'personal_data'
  }

  return failureCount >= 2 ? 'repeated_failure' : null
}
