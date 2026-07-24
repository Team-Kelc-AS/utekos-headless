export type AssistantProductHandle =
  | 'utekos-techdown'
  | 'utekos-dun'
  | 'utekos-mikrofiber'
  | 'comfyrobe'

export type ProductProfile = {
  readonly handle: AssistantProductHandle
  readonly cues: readonly string[]
  readonly reason: string
}

export const assistantProductProfiles: readonly ProductProfile[] =
  [
    {
      handle: 'utekos-techdown',
      cues: [
        'båt',
        'kyst',
        'fukt',
        'skiftende vær',
        'helårsbruk'
      ],
      reason:
        'TechDown er det mest allsidige alternativet for fuktig og skiftende vær.'
    },
    {
      handle: 'utekos-dun',
      cues: [
        'tørr kulde',
        'mest varme',
        'varme per gram',
        'hytte'
      ],
      reason:
        'Utekos Dun gir mest varme per gram i tørt og kaldt vær.'
    },
    {
      handle: 'utekos-mikrofiber',
      cues: [
        'bobil',
        'reise',
        'lett',
        'rask tørk',
        'enkel vask'
      ],
      reason:
        'Utekos Mikrofiber er lett, pakkbar og enkel å vaske og tørke.'
    },
    {
      handle: 'comfyrobe',
      cues: [
        'regn',
        'hundelufting',
        'sidelinje',
        'isbading',
        'allværskåpe'
      ],
      reason:
        'Comfyrobe kombinerer værbeskyttelse med en romslig allværs-passform.'
    }
  ] as const

const cueBoundary = '[^\\p{L}\\p{N}]'

const cueExtensions = new Map<string, readonly string[]>([
  ['båt', ['båttur']],
  ['hytte', ['hyttetur']],
  ['regn', ['regnvær']],
  ['hundelufting', ['hundeluftingen']]
])

function escapeRegularExpression(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function createCueFormPattern(cueForm: string) {
  return cueForm
    .split(/\s+/u)
    .map(escapeRegularExpression)
    .join('\\s+')
}

const cuePatterns = new Map(
  assistantProductProfiles
    .flatMap(profile => profile.cues)
    .map(cue => [
      cue,
      new RegExp(
        `(?:^|${cueBoundary})(?:${[
          cue,
          ...(cueExtensions.get(cue) ?? [])
        ]
          .map(createCueFormPattern)
          .join('|')})(?=$|${cueBoundary})`,
        'u'
      )
    ])
)

export function normalizeAssistantText(text: string) {
  return text.normalize('NFC').trim().toLocaleLowerCase('nb-NO')
}

export function matchesAssistantCue(
  normalizedText: string,
  cue: string
) {
  return cuePatterns.get(cue)?.test(normalizedText) ?? false
}

export function countAssistantProfileCues(
  normalizedText: string,
  profile: ProductProfile
) {
  return profile.cues.filter(cue =>
    matchesAssistantCue(normalizedText, cue)
  ).length
}
