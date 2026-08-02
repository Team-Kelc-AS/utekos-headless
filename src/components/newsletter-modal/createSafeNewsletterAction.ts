import type { ActionState } from '@/lib/actions/subscribeToNewsLetters'

type NewsletterActionDependencies = {
  appendTrackingContext: (formData: FormData) => void
  subscribe: (
    previousState: ActionState,
    formData: FormData
  ) => Promise<ActionState>
}

const submissionFailureState: ActionState = {
  status: 'error',
  message: 'Noe gikk galt. Prøv igjen senere.'
}

export function createSafeNewsletterAction({
  appendTrackingContext,
  subscribe
}: NewsletterActionDependencies) {
  return async function submitNewsletter(
    previousState: ActionState,
    formData: FormData
  ): Promise<ActionState> {
    try {
      appendTrackingContext(formData)
      return await subscribe(previousState, formData)
    } catch {
      return submissionFailureState
    }
  }
}
