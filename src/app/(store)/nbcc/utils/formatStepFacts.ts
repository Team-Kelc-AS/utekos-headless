import { nbccSteps } from './nbccLandingPageContent'

export function formatStepFacts(): string {
  return nbccSteps.map((step, index) => `${index + 1}. ${step.title}: ${step.description}`).join('\n')
}
