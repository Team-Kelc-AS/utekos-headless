import { nbccFaqItems } from './nbccLandingPageContent'

export function formatFaqFacts(): string {
  return nbccFaqItems.map(item => `- ${item.question}: ${item.answer}`).join('\n')
}
