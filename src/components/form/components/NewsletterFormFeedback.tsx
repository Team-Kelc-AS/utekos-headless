import { CheckCircle2 } from 'lucide-react'

import type { ActionState } from '@/lib/actions/subscribeToNewsLetters'

type NewsletterFormFeedbackProps = { state: ActionState }

export function NewsletterFormFeedback({
  state
}: NewsletterFormFeedbackProps) {
  return (
    <div
      aria-live='polite'
      aria-atomic='true'
      className='min-h-6 w-full'
    >
      {state.status === 'success' ?
        <p
          role='status'
          className='flex items-start gap-2 text-sm leading-6 font-medium text-white sm:text-base'
        >
          <CheckCircle2
            aria-hidden='true'
            className='mt-0.5 size-5 shrink-0'
          />
          <span>{state.message}</span>
        </p>
      : state.status === 'error' ?
        <p
          role='alert'
          className='text-sm leading-6 font-medium text-white sm:text-base'
        >
          {state.message}
        </p>
      : null}
    </div>
  )
}
