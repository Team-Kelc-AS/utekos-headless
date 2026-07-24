'use client'

import type { AssistantHandoffRow } from './assistantViewModel'
import {
  CheckIcon,
  ClipboardIcon,
  MailIcon,
  MessageSquareTextIcon,
  PhoneIcon
} from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import { useId, useState } from 'react'

type AssistantHandoffProps = {
  handoff: AssistantHandoffRow['handoff']
  summary: string
}

export function AssistantHandoff({
  handoff,
  summary
}: AssistantHandoffProps) {
  const headingId = useId()
  const summaryId = useId()
  const [copyStatus, setCopyStatus] = useState<
    'idle' | 'copied' | 'failed'
  >('idle')

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  return (
    <section
      aria-labelledby={headingId}
      className='rounded-2xl border border-border bg-muted p-4 text-popover-foreground'
    >
      <h3 id={headingId} className='text-base font-semibold'>
        Snakk med kundeservice
      </h3>
      <p className='mt-1 text-sm leading-6 text-popover-foreground/75'>
        Du velger selv hvordan du vil ta kontakt. Ingenting
        sendes automatisk.
      </p>

      <div className='mt-4 grid gap-2'>
        <Link
          href={handoff.contactPath as Route}
          className='hover:bg-primary-hover inline-flex min-h-11 items-center gap-3 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none'
        >
          <MessageSquareTextIcon
            className='size-4'
            aria-hidden='true'
          />
          Åpne kontaktskjema
        </Link>
        <a
          href={handoff.emailHref}
          className='inline-flex min-h-11 items-center gap-3 rounded-xl border border-border bg-popover px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none'
        >
          <MailIcon className='size-4' aria-hidden='true' />
          {handoff.emailLabel}
        </a>
        <a
          href={handoff.phoneHref}
          className='inline-flex min-h-11 items-center gap-3 rounded-xl border border-border bg-popover px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none'
        >
          <PhoneIcon className='size-4' aria-hidden='true' />
          {handoff.phoneLabel}
        </a>
      </div>

      {summary && (
        <div className='mt-5'>
          <label
            htmlFor={summaryId}
            className='text-sm font-medium'
          >
            Samtalesammendrag du kan kopiere
          </label>
          <textarea
            id={summaryId}
            readOnly
            value={summary}
            rows={5}
            className='mt-2 w-full resize-y rounded-xl border border-input bg-popover px-3 py-2.5 text-sm leading-6 text-popover-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
          />
          <button
            type='button'
            onClick={copySummary}
            className='mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-popover px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none'
          >
            {copyStatus === 'copied' ?
              <CheckIcon className='size-4' aria-hidden='true' />
            : <ClipboardIcon
                className='size-4'
                aria-hidden='true'
              />
            }
            {copyStatus === 'copied' ?
              'Kopiert'
            : 'Kopier sammendrag'}
          </button>
          <p className='sr-only' aria-live='polite'>
            {copyStatus === 'copied' &&
              'Sammendraget er kopiert.'}
            {copyStatus === 'failed' &&
              'Sammendraget kunne ikke kopieres automatisk. Marker teksten og kopier den manuelt.'}
          </p>
        </div>
      )}
    </section>
  )
}
