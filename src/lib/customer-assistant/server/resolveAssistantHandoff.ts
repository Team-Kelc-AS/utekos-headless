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

const labeledPersonalSharingPattern =
  /\b(?:telefonnummer(?:et)?|e-post(?:adresse(?:n)?)?|epost(?:adresse(?:n)?)?|adresse(?:n)?|fødselsnummer|personnummer)\b(?:\s+(?:er|:))?\s+(?:min|mitt|mine)\b|\b(?:min|mitt|mine)\s+(?:telefonnummer(?:et)?|e-post(?:adresse(?:n)?)?|epost(?:adresse(?:n)?)?|adresse(?:n)?|fødselsnummer|personnummer)\b/u

const directPersonalSharingPattern =
  /\b(?:(?:du\s+kan|kan\s+du)\s+)?(?:kontakte|kontakt|ringe|ring|sende|send)\s+meg(?:\s+(?:telefonnummer(?:et)?|e-post(?:adresse(?:n)?)?|epost(?:adresse(?:n)?)))?\s+(?:på|via|til)\s+(?:\d{8}|\d{3}\s\d{2}\s\d{3}|[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+)\b/u

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
    labeledPersonalSharingPattern.test(normalizedText) ||
    directPersonalSharingPattern.test(normalizedText)
  ) {
    return 'personal_data'
  }

  return failureCount >= 2 ? 'repeated_failure' : null
}
