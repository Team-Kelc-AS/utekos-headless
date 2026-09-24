import type { NbccAiSummaryIntent } from '../types'

export function isNbccAiSummaryIntent(value: string | null): value is NbccAiSummaryIntent {
  return value === 'how-to-use' || value === 'sizes'
}
