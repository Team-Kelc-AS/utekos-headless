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
import { H2 } from '@/components/typography/TypographyH2'
import { P } from '@/components/typography/TypographyP'

const initialState: ActionState = {
  status: 'idle',
  message: ''
}

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
        className='w-full overflow-hidden rounded-[1.25rem] bg-teal-900 px-5 py-8 text-white sm:px-10 sm:py-10'
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

              <H2
                Text='Meld deg på Utekos sitt nyhetsbrev!'
                ID='newsletter-heading'
                className='pb-0 text-2xl text-balance text-white md:text-3xl lg:text-3xl'
              />
            </div>

            <div className='flex flex-col gap-1.5 text-white/86'>
              <P
                Text='Som medlem i vår kundeklubb får du personlige tilbud og tilgang til salg og kampanjer først.'
                className='not-first:mt-0'
              />
              <P
                Text='Du får også masse tips og inspirasjon rett inn i innboksen din.'
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
              className='font-utekos-text-medium hover:bg-primary-hover dark:hover:bg-dark-primary-hover h-12 w-full shrink-0 bg-teal-500 px-6 py-0 text-base text-[#001212] transition-colors duration-300 sm:w-auto dark:bg-teal-500 dark:text-[#001212]'
            >
              <button
                type='submit'
                disabled={isPending}
                aria-busy={isPending}
                className='group dark:focus-visible:outline-dark-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60'
              >
                {isPending ? 'Sender…' : 'Meld meg inn'}
                <ArrowRight className='ml-2 size-5 transition-transform duration-300 group-hover:translate-x-1' />
              </button>
            </BrandBadge>
          </form>
        </div>
      </section>
    </article>
  )
}
