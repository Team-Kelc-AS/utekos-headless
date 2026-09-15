import type { NbccAiSummaryIntent, NbccAiSummaryPayload } from '../types'
import { FALLBACK_SUMMARIES } from '../constants'

export function getNbccAiSummaryFallback(intent: NbccAiSummaryIntent): NbccAiSummaryPayload {
  return FALLBACK_SUMMARIES[intent]
}
