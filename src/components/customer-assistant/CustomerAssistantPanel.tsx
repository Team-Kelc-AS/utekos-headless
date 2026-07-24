'use client'

import type {
  AssistantIntent,
  AssistantUIMessage
} from '@/lib/customer-assistant/assistantProtocol'
import { SendIcon, XIcon } from 'lucide-react'
import type { KeyboardEvent, RefObject } from 'react'
import { AssistantHandoff } from './AssistantHandoff'
import {
  AssistantMessageList,
  type AssistantChatStatus
} from './AssistantMessageList'
import { AssistantQuickActions } from './AssistantQuickActions'
import {
  createHandoffSummary,
  type AssistantHandoffRow
} from './assistantViewModel'

const errorHandoff: AssistantHandoffRow['handoff'] = {
  contactPath: '/kontaktskjema',
  emailHref: 'mailto:kundeservice@utekos.no',
  emailLabel: 'kundeservice@utekos.no',
  phoneHref: 'tel:+4740216343',
  phoneLabel: '+47 40 21 63 43',
  reason: 'repeated_failure'
}

type CustomerAssistantPanelProps = {
  error: Error | undefined
  firstActionRef: RefObject<HTMLButtonElement | null>
  headingId: string
  headingRef: RefObject<HTMLHeadingElement | null>
  input: string
  inputId: string
  intent: AssistantIntent
  messages: AssistantUIMessage[]
  panelId: string
  status: AssistantChatStatus
  onClose: () => void
  onInputChange: (value: string) => void
  onIntentSelect: (
    intent: AssistantIntent,
    prompt: string
  ) => void
  onSubmit: () => void
}

export function CustomerAssistantPanel({
  error,
  firstActionRef,
  headingId,
  headingRef,
  input,
  inputId,
  intent,
  messages,
  panelId,
  status,
  onClose,
  onInputChange,
  onIntentSelect,
  onSubmit
}: CustomerAssistantPanelProps) {
  const isBusy = status === 'submitted' || status === 'streaming'
  const canSubmit = status === 'ready' && input.trim().length > 0

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  function handleComposerKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <section
      id={panelId}
      role='dialog'
      aria-modal='false'
      aria-labelledby={headingId}
      onKeyDown={handleKeyDown}
      className='animate-in fade-in-0 slide-in-from-bottom-3 fixed inset-x-4 top-20 bottom-20 z-40 flex flex-col overflow-hidden rounded-3xl border border-border bg-popover text-popover-foreground shadow-2xl duration-200 motion-reduce:transform-none motion-reduce:animate-none motion-reduce:transition-none sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-22 sm:max-h-[min(42rem,calc(100svh-7rem))] sm:w-[26rem]'
    >
      <header className='flex items-start justify-between gap-4 border-b border-border px-5 py-4'>
        <div>
          <p className='text-xs font-semibold tracking-wide text-popover-foreground/65 uppercase'>
            Utekos
          </p>
          <h2
            ref={headingRef}
            id={headingId}
            tabIndex={-1}
            className='mt-1 text-xl leading-tight font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            Kjøpshjelp
          </h2>
          <p className='mt-1 text-sm text-popover-foreground/70'>
            Praktisk hjelp før du velger.
          </p>
        </div>
        <button
          type='button'
          aria-label='Lukk kjøpshjelp'
          onClick={onClose}
          className='inline-flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none'
        >
          <XIcon className='size-5' aria-hidden='true' />
        </button>
      </header>

      <div className='min-h-0 flex-1 overflow-y-auto px-5 py-5'>
        {messages.length === 0 ?
          <AssistantQuickActions
            disabled={status !== 'ready'}
            firstActionRef={firstActionRef}
            intent={intent}
            onSelect={onIntentSelect}
          />
        : <AssistantMessageList
            messages={messages}
            status={status}
          />
        }

        {isBusy && (
          <p
            role='status'
            aria-live='polite'
            className='mt-4 text-sm text-popover-foreground/70'
          >
            {status === 'submitted' ?
              'Finner et trygt svar …'
            : 'Svarer …'}
          </p>
        )}

        {error && (
          <div className='mt-5 space-y-4'>
            <p role='alert' className='text-sm leading-6'>
              Jeg fikk ikke hentet et sikkert svar. Du kan
              kontakte kundeservice.
            </p>
            <AssistantHandoff
              handoff={errorHandoff}
              summary={createHandoffSummary(messages)}
            />
          </div>
        )}
      </div>

      <form
        className='border-t border-border bg-popover px-4 py-4'
        onSubmit={event => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <label htmlFor={inputId} className='sr-only'>
          Skriv spørsmålet ditt
        </label>
        <div className='flex items-end gap-2'>
          <textarea
            id={inputId}
            value={input}
            maxLength={800}
            rows={2}
            disabled={status !== 'ready'}
            placeholder='Hva lurer du på?'
            onChange={event =>
              onInputChange(event.currentTarget.value)
            }
            onKeyDown={handleComposerKeyDown}
            className='min-h-12 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-foreground/55 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60'
          />
          <button
            type='submit'
            disabled={!canSubmit}
            className='hover:bg-primary-hover inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none'
          >
            <SendIcon className='size-5' aria-hidden='true' />
            <span className='sr-only'>Send spørsmål</span>
          </button>
        </div>
        <p className='mt-2 text-xs text-popover-foreground/60'>
          Ikke skriv inn ordre-, betalings- eller
          kontaktopplysninger.
        </p>
      </form>
    </section>
  )
}
