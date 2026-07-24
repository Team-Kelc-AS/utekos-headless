'use client'

import { ThumbsDownIcon, ThumbsUpIcon } from 'lucide-react'
import type { AssistantFeedbackValue } from './assistantViewModel'

export type { AssistantFeedbackValue } from './assistantViewModel'

type AssistantFeedbackProps = {
  responseId: string
  value: AssistantFeedbackValue | null
  onSelect: (
    responseId: string,
    value: AssistantFeedbackValue
  ) => void
}

export function AssistantFeedback({
  responseId,
  value,
  onSelect
}: AssistantFeedbackProps) {
  const disabled = value !== null

  return (
    <div className='mt-3' aria-label='Var dette svaret nyttig?'>
      <p className='text-xs text-popover-foreground/70'>
        Var dette svaret nyttig?
      </p>
      <div className='mt-1.5 flex gap-2'>
        <button
          type='button'
          disabled={disabled}
          aria-pressed={value === 'helpful'}
          onClick={() => onSelect(responseId, 'helpful')}
          className='inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default disabled:opacity-60 aria-pressed:bg-accent aria-pressed:opacity-100 motion-reduce:transition-none'
        >
          <ThumbsUpIcon className='size-4' aria-hidden='true' />
          Nyttig
        </button>
        <button
          type='button'
          disabled={disabled}
          aria-pressed={value === 'not_helpful'}
          onClick={() => onSelect(responseId, 'not_helpful')}
          className='inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default disabled:opacity-60 aria-pressed:bg-accent aria-pressed:opacity-100 motion-reduce:transition-none'
        >
          <ThumbsDownIcon
            className='size-4'
            aria-hidden='true'
          />
          Ikke nyttig
        </button>
      </div>
      <p className='sr-only' aria-live='polite'>
        {value !== null && 'Takk for tilbakemeldingen.'}
      </p>
    </div>
  )
}
