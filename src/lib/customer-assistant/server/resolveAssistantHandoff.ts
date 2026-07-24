import type { AssistantHandoff } from '../assistantProtocol'
import { normalizeAssistantText } from '../assistantProductProfiles'

const handoffPatterns: ReadonlyArray<
  readonly [
    Exclude<
      AssistantHandoff['reason'],
      'uncertain' | 'repeated_failure'
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
  ],
  [
    'personal_data',
    /\b(?:telefonnummer(?:et)?|e-post(?:adresse(?:n)?)?|epost(?:adresse(?:n)?)?|adresse(?:n)?|fødselsnummer|personnummer|\d{8}|\d{3}\s\d{2}\s\d{3})\b/u
  ]
]

export function resolveAssistantHandoff(
  text: string,
  failureCount: number
): AssistantHandoff['reason'] | null {
  const normalizedText = normalizeAssistantText(text)
  const matchedReason = handoffPatterns.find(([, pattern]) =>
    pattern.test(normalizedText)
  )?.[0]

  if (matchedReason) {
    return matchedReason
  }

  return failureCount >= 2 ? 'repeated_failure' : null
}
