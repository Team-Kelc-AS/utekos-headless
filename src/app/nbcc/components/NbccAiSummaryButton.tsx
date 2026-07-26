'use client'

import {
  BrainCircuitIcon,
  ChevronDownIcon,
  SparklesIcon
} from 'lucide-react'
import Link from 'next/link'
import type { Route } from 'next'
import { useEffect, useId, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  FALLBACK_SUMMARIES,
  MINIMUM_THINKING_TIME_MS
} from '../constants'
import type {
  NbccAiSummaryButtonProps,
  NbccAiSummaryStatus,
  NbccAiSummaryPayload,
  NbccAiSummaryResponse
} from '../types'
import { LinkedSectionBody } from './LinkedSectionBody'
import { renderSectionItems } from '../utils/renderSectionItems'

export function NbccAiSummaryButton({
  intent,
  idleLabel,
  completedLabel = 'Vis forklaring',
  trackingName,
  trackingData,
  buttonClassName,
  containerClassName = 'w-full',
  panelClassName = 'w-full'
}: NbccAiSummaryButtonProps) {
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] =
    useState<NbccAiSummaryStatus>('idle')
  const [isOpen, setIsOpen] = useState(false)
  const [payload, setPayload] =
    useState<NbccAiSummaryPayload | null>(null)

  const isThinking = status === 'thinking'
  const isCompleted = status === 'completed'

  const buttonLabel =
    isThinking ? 'Henter forklaring'
    : isCompleted && isOpen ? 'Skjul forklaring'
    : isCompleted ? completedLabel
    : idleLabel

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target

      if (!(target instanceof Node)) return

      if (!rootRef.current?.contains(target)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown
      )
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  async function handleActivate() {
    if (isThinking) return

    if (isCompleted) {
      setIsOpen(previous => !previous)
      return
    }

    setStatus('thinking')
    setIsOpen(true)

    try {
      const minimumDelay = new Promise(resolve =>
        setTimeout(resolve, MINIMUM_THINKING_TIME_MS)
      )
      const fetchPromise = fetch(
        `/api/nbcc-ai-summary?intent=${encodeURIComponent(intent)}`,
        { cache: 'no-store' }
      )

      const [response] = await Promise.all([
        fetchPromise,
        minimumDelay
      ])
      const data =
        (await response.json()) as NbccAiSummaryResponse

      if (!response.ok) {
        throw new Error(
          data.error || 'Kunne ikke hente forklaring'
        )
      }

      setPayload({
        kicker: data.kicker,
        title: data.title,
        intro: data.intro,
        sections: data.sections
      })
    } catch (error) {
      console.error(
        `[NbccAiSummaryButton] failed for ${intent}:`,
        error
      )
      setPayload(FALLBACK_SUMMARIES[intent])
    } finally {
      setStatus('completed')
    }
  }

  function handleClose() {
    setIsOpen(false)
  }

  return (
    <div ref={rootRef} className={containerClassName}>
      <Button
        type='button'
        variant='outline'
        size='lg'
        onClick={handleActivate}
        disabled={isThinking}
        aria-expanded={isOpen}
        aria-controls={panelId}
        data-track={trackingName}
        data-track-data={JSON.stringify(trackingData)}
        className={buttonClassName}
      >
        {isThinking ?
          <BrainCircuitIcon
            className='h-4 w-4 animate-pulse'
            aria-hidden
          />
        : <SparklesIcon className='h-4 w-4' aria-hidden />}
        <span>{buttonLabel}</span>
        {isCompleted ?
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        : null}
      </Button>

      <div
        id={panelId}
        className={`grid transition-all duration-300 ease-out ${panelClassName} ${
          isOpen ?
            'grid-rows-[1fr] opacity-100'
          : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className='w-full overflow-hidden'>
          <div className='mt-3 w-full overflow-hidden rounded-xl border border-[#f0c36a]/25 bg-[#16120e] text-left shadow-xl shadow-black/20'>
            {isThinking ?
              <div
                aria-live='polite'
                aria-busy='true'
                className='px-5 py-5 text-[#f5efe4]'
              >
                <div className='flex items-center gap-3'>
                  <BrainCircuitIcon
                    className='h-5 w-5 animate-pulse text-[#f0c36a]'
                    aria-hidden
                  />
                  <div>
                    <p className='font-google-sans text-[11px] font-bold tracking-[0.18em] text-[#f0c36a] uppercase'>
                      Henter veiledning
                    </p>
                    <p className='mt-1 text-sm text-[#f5efe4]/75'>
                      Setter sammen en ryddig forklaring...
                    </p>
                  </div>
                </div>
                <div className='mt-5 animate-pulse space-y-2.5'>
                  <div className='h-2.5 w-full rounded-full bg-white/15' />
                  <div className='h-2.5 w-[84%] rounded-full bg-white/15' />
                  <div className='h-2.5 w-[62%] rounded-full bg-white/15' />
                </div>
              </div>
            : payload ?
              <>
                <header className='border-b border-white/10 bg-white/[0.035] px-5 py-4'>
                  <div className='font-google-sans flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-[#f0c36a] uppercase'>
                    <SparklesIcon
                      className='h-3.5 w-3.5'
                      aria-hidden
                    />
                    {payload.kicker}
                  </div>
                  <h3 className='mt-2 font-utekos-text-medium text-base leading-snug text-white sm:text-lg'>
                    {payload.title}
                  </h3>
                </header>

                <div className='px-5 py-5'>
                  <p className='text-sm leading-7 text-[#f5efe4]/88'>
                    {payload.intro}
                  </p>

                  <div className='mt-5 space-y-5'>
                    {payload.sections.map(section => (
                      <article
                        key={section.title}
                        className='rounded-lg border border-white/10 bg-white/3 px-4 py-4'
                      >
                        <h4 className='font-utekos-text-medium text-sm text-white'>
                          {section.title}
                        </h4>

                        <LinkedSectionBody
                          intent={intent}
                          section={section}
                        />

                        {renderSectionItems(section)}
                      </article>
                    ))}
                  </div>

                  {intent === 'sizes' ?
                    <p className='mt-4 border-t border-white/10 pt-4 text-sm leading-6 text-[#f5efe4]/72'>
                      Er du fremdeles usikker? Ta en rask titt i{' '}
                      <Link
                        href={
                          '/handlehjelp/storrelsesguide' as Route
                        }
                        className='font-utekos-text-medium text-[#f0c36a] underline decoration-[#f0c36a]/40 underline-offset-4 hover:text-[#ffd886]'
                      >
                        størrelsesguiden vår
                      </Link>
                      .
                    </p>
                  : null}

                  <div className='mt-5 flex justify-end border-t border-white/10 pt-4'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleClose}
                      className='rounded-md border-white/20 bg-white/4 px-4 text-white hover:bg-white/10'
                    >
                      Skjul forklaring
                    </Button>
                  </div>
                </div>
              </>
            : null}
          </div>
        </div>
      </div>
    </div>
  )
}
