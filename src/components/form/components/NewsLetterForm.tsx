// src/components/form/components/NewsLetterForm.tsx

'use client'

import { useActionState, useEffect, useRef } from 'react'
import {
  subscribeToNewsletter,
  type ActionState
} from '@/lib/actions/subscribeToNewsLetters'
import { appendLeadTrackingContext } from '@/lib/analytics/collectLeadFormTrackingContext'
import { pushGenerateLeadToDataLayer } from '@/lib/analytics/pushGenerateLeadToDataLayer'
import { Input } from '@/components/ui/input'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { ArrowRight, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { P } from '@/components/typography/TypographyP'
import { Button } from '@/components/ui/button'
import { NewsletterFormFeedback } from '@/components/form/components/NewsletterFormFeedback'
const initialState: ActionState = { status: 'idle', message: '' }

export function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    initialState
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === 'success') {
      if (state.dataLayerEvent) {
        pushGenerateLeadToDataLayer(state.dataLayerEvent)
      }
      toast.success(state.message)
      formRef.current?.reset()
    } else if (state.status === 'error') {
      toast.error(state.message)
    }
  }, [state])

  const handleSubmit = (formData: FormData) => {
    appendLeadTrackingContext(formData)
    formAction(formData)
  }

  return (
    <article className='mx-auto w-full'>
      <section
        aria-labelledby='newsletter-heading'
        className='w-full overflow-hidden rounded-[1.25rem] bg-jungle px-5 py-8 text-white sm:px-10 sm:py-10'
      >
        <div className='mx-auto flex w-full max-w-2xl flex-col items-start gap-4 text-left'>
          <hgroup className='flex flex-col gap-3'>
            <div className='flex items-center gap-4'>
              <span
                aria-hidden='true'
                className='flex size-12 shrink-0 items-center justify-center rounded-full bg-white/14 text-white'
              >
                <Mail className='size-6' />
              </span>

              <h2
                id='newsletter-heading'
                className='scroll-m-20 pb-0 font-sans text-2xl tracking-tight text-balance text-white md:text-3xl lg:text-3xl'
              >
                Meld deg på Utekos sitt nyhetsbrev!
              </h2>
            </div>

            <div className='flex flex-col gap-1.5 text-white/86'>
              <P
                Text='Som medlem i vår kundeklubb får du personlige varsler om tilbud, salg og kampanjer.'
                className='not-first:mt-0'
              />
              <P
                Text='Du får også tips, inspirasjon og nye artikler fra Utekos-magasinet.'
                className='not-first:mt-0'
              />
            </div>
          </hgroup>

          <form
            ref={formRef}
            action={handleSubmit}
            className='mt-2 flex w-full flex-col gap-3 sm:flex-row sm:items-center'
          >
            <label
              htmlFor='newsletter-email'
              className='sr-only'
            >
              Din e-postadresse
            </label>

            <Input
              id='newsletter-email'
              type='email'
              name='email'
              autoComplete='email'
              placeholder='Din e-postadresse…'
              required
              className='h-12 w-full rounded-full border-white/55 bg-white px-5 text-base text-[#222222] placeholder:text-[#606568] md:text-base'
            />

            <BrandBadge
              asChild
              className='hover:bg-primary-hover h-12 w-full shrink-0 px-6 py-0 font-utekos-text-medium text-base text-foreground transition-colors duration-300 sm:w-auto'
            >
              <Button
                type='submit'
                disabled={isPending}
                aria-busy={isPending}
                className='group dark:focus-visible:outline-dark-ring cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60'
              >
                {isPending ? 'Sender…' : 'Meld meg inn'}
                <ArrowRight className='ml-2 size-5 transition-transform duration-300 group-hover:translate-x-1' />
              </Button>
            </BrandBadge>
          </form>

          <NewsletterFormFeedback state={state} />
        </div>
      </section>
    </article>
  )
}
