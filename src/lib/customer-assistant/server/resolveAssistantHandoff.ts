import type { AssistantHandoff } from '../assistantProtocol'

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
    /\b(?:ordre|ordren|ordrer|ordrenummer|sporing|sporingsnummer)\b/u
  ],
  ['payment', /\b(?:betaling|betalingen|klarna|faktura)\b/u],
  ['complaint', /\b(?:reklamere|reklamasjon|klage)\b/u],
  [
    'personal_data',
    /\b(?:telefonnummer|telefonnummeret|e-post|epost|adresse|fødselsnummer|personnummer|\d{8})\b/u
  ]
]

export function resolveAssistantHandoff(
  text: string,
  failureCount: number
): AssistantHandoff['reason'] | null {
  const normalizedText = text.trim().toLocaleLowerCase('nb-NO')
  const matchedReason = handoffPatterns.find(([, pattern]) =>
    pattern.test(normalizedText)
  )?.[0]

  if (matchedReason) {
    return matchedReason
  }

  return failureCount >= 2 ? 'repeated_failure' : null
}
