export type AssistantProductHandle =
  | 'utekos-techdown'
  | 'utekos-dun'
  | 'utekos-mikrofiber'
  | 'comfyrobe'

export type ProductProfile = {
  handle: AssistantProductHandle
  cues: readonly string[]
  reason: string
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
