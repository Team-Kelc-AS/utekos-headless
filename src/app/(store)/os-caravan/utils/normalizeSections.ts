import { cleanText } from './cleanText'
import type { NbccAiSummarySection } from '../types'

export function normalizeSections(sections: NbccAiSummarySection[]): NbccAiSummarySection[] {
  return sections.map(section => {
    const normalizedSection: NbccAiSummarySection = {
      title: cleanText(section.title)
    }

    if (section.body) {
      normalizedSection.body = cleanText(section.body)
    }

    if (section.items?.length) {
      normalizedSection.items = section.items.map(cleanText).filter(Boolean)
    }

    if (section.style) {
      normalizedSection.style = section.style
    }

    return normalizedSection
  })
}
