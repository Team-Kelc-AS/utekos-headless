import { cleanText } from './cleanText'
import { normalizeSections } from './normalizeSections'
import type { NbccAiSummaryPayload } from '../types'

export function normalizeSummaryPayload(payload: NbccAiSummaryPayload): NbccAiSummaryPayload {
  return {
    kicker: cleanText(payload.kicker),
    title: cleanText(payload.title),
    intro: cleanText(payload.intro),
    sections: normalizeSections(payload.sections)
  }
}
