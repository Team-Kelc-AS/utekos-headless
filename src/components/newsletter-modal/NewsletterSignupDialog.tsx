'use client'

import Link from 'next/link'
import {
  useActionState,
  useEffect,
  useRef,
  useState
} from 'react'
import { Check, Loader2, Mail, Gift, XIcon } from 'lucide-react'

import {
  subscribeToNewsletter,
  type ActionState
} from '@/lib/actions/subscribeToNewsLetters'
import { appendLeadTrackingContext } from '@/lib/analytics/collectLeadFormTrackingContext'
import { pushGenerateLeadToDataLayer } from '@/lib/analytics/pushGenerateLeadToDataLayer'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

import { NEWSLETTER_DISCOUNT_PERCENT } from './newsletterModalConfig'
import {
  getCookiebotFromWindow,
  getNewsletterModalRuntimeState,
  isCookiebotBannerVisible,
  persistNewsletterModalDismissal,
  readNewsletterModalDismissals
} from './newsletterModalRuntime'

const initialState: ActionState = { status: 'idle', message: '' }

const OPEN_DELAY_MS = 500
const DEVELOPMENT_INITIAL_DELAY_MS = 1500
const DEVELOPMENT_POLL_INTERVAL_MS = 500

type BrowserStorageName = 'localStorage' | 'sessionStorage'

function getBrowserStorage(
  storageName: BrowserStorageName
): Storage | undefined {
  try {
    return window[storageName]
  } catch {
    return undefined
  }
}

function isDevelopmentLocalhost(): boolean {
  if (process.env.NODE_ENV !== 'development') {
    return false
  }

  return ['localhost', '127.0.0.1', '::1'].includes(
    window.location.hostname
  )
}

function persistDismissal(): void {
  const cookiebot = getCookiebotFromWindow(window)

  persistNewsletterModalDismissal({
    localStorage: getBrowserStorage('localStorage'),
    sessionStorage: getBrowserStorage('sessionStorage'),
    preferencesConsentGranted:
      cookiebot?.consent?.preferences === true
  })
}

export function NewsletterSignupDialog() {
  const [open, setOpen] = useState(false)

  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    initialState
  )

  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    let disposed = false
    let resolved = false

    let openTimer: number | undefined
    let initialTimer: number | undefined
    let developmentPoll: number | undefined

    const localStorage = getBrowserStorage('localStorage')

    const sessionStorage = getBrowserStorage('sessionStorage')

    const stopDevelopmentPoll = () => {
      if (developmentPoll !== undefined) {
        window.clearInterval(developmentPoll)

        developmentPoll = undefined
      }
    }

    const evaluate = () => {
      if (disposed || resolved) {
        return
      }

      const cookiebot = getCookiebotFromWindow(window)

      const dismissals = readNewsletterModalDismissals(
        localStorage,
        sessionStorage
      )

      const runtime = getNewsletterModalRuntimeState({
        cookiebot,
        hostname: window.location.hostname,
        nodeEnvironment: process.env.NODE_ENV,
        cookieBannerVisible: isCookiebotBannerVisible(
          document,
          window
        ),
        ...dismissals
      })

      if (runtime.suppressed) {
        resolved = true
        stopDevelopmentPoll()
        return
      }

      if (!runtime.canOpen) {
        return
      }

      if (openTimer !== undefined) {
        return
      }

      openTimer = window.setTimeout(() => {
        openTimer = undefined

        if (disposed || resolved) {
          return
        }

        const latestCookiebot = getCookiebotFromWindow(window)

        const latestDismissals = readNewsletterModalDismissals(
          localStorage,
          sessionStorage
        )

        const latestRuntime = getNewsletterModalRuntimeState({
          cookiebot: latestCookiebot,
          hostname: window.location.hostname,
          nodeEnvironment: process.env.NODE_ENV,
          cookieBannerVisible: isCookiebotBannerVisible(
            document,
            window
          ),
          ...latestDismissals
        })

        if (!latestRuntime.canOpen) {
          return
        }

        resolved = true
        stopDevelopmentPoll()
        setOpen(true)
      }, OPEN_DELAY_MS)
    }

    const handleCookiebotChange = () => {
      evaluate()
    }

    window.addEventListener(
      'CookiebotOnConsentReady',
      handleCookiebotChange
    )

    window.addEventListener(
      'CookiebotOnAccept',
      handleCookiebotChange
    )

    window.addEventListener(
      'CookiebotOnDecline',
      handleCookiebotChange
    )

    if (isDevelopmentLocalhost()) {
      initialTimer = window.setTimeout(() => {
        evaluate()

        if (!resolved) {
          developmentPoll = window.setInterval(
            evaluate,
            DEVELOPMENT_POLL_INTERVAL_MS
          )
        }
      }, DEVELOPMENT_INITIAL_DELAY_MS)
    } else {
      evaluate()
    }

    return () => {
      disposed = true

      window.removeEventListener(
        'CookiebotOnConsentReady',
        handleCookiebotChange
      )

      window.removeEventListener(
        'CookiebotOnAccept',
        handleCookiebotChange
      )

      window.removeEventListener(
        'CookiebotOnDecline',
        handleCookiebotChange
      )

      if (openTimer !== undefined) {
        window.clearTimeout(openTimer)
      }

      if (initialTimer !== undefined) {
        window.clearTimeout(initialTimer)
      }

      stopDevelopmentPoll()
    }
  }, [])

  useEffect(() => {
    if (state.status !== 'success') {
      return
    }

    if (state.dataLayerEvent) {
      pushGenerateLeadToDataLayer(state.dataLayerEvent)
    }

    persistDismissal()
    formRef.current?.reset()
  }, [state])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      persistDismissal()
    }

    setOpen(nextOpen)
  }

  const handleSubmit = (formData: FormData) => {
    appendLeadTrackingContext(formData)
    formAction(formData)
  }

  const emailDescription =
    state.status === 'error' ?
      'newsletter-modal-email-help newsletter-modal-error'
    : 'newsletter-modal-email-help'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className='max-h-[calc(100svh-2rem)] overflow-y-auto bg-transparent p-0 ring-0 sm:max-w-xl'
      >
        {state.status === 'success' ?
          <section
            aria-live='polite'
            className='relative overflow-hidden rounded-xl bg-popover px-6 py-10 text-center text-popover-foreground sm:px-10 sm:py-12'
          >
            <DialogClose
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='absolute top-3 right-3 text-popover-foreground hover:bg-accent hover:text-accent-foreground'
                />
              }
            >
              <XIcon aria-hidden='true' />

              <span className='sr-only'>
                Lukk nyhetsbrevmodalen
              </span>
            </DialogClose>

            <span
              aria-hidden='true'
              className='mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground'
            >
              <Check className='size-8' />
            </span>

            <DialogHeader className='items-center'>
              <DialogTitle className='font-utekos-text-medium text-2xl leading-tight text-popover-foreground sm:text-3xl'>
                Rabattkoden er på vei
              </DialogTitle>

              <DialogDescription className='max-w-md text-base leading-7 text-popover-foreground/80'>
                {state.message}
              </DialogDescription>
            </DialogHeader>

            <p className='mx-auto mt-4 max-w-md text-sm leading-6 text-popover-foreground/70'>
              Sjekk også søppelpostmappen dersom e-posten ikke
              dukker opp med en gang.
            </p>

            <div className='mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center'>
              <Button
                asChild
                variant='commerce-primary'
                size='lg'
                className='min-h-12 rounded-full px-7 text-base'
              >
                <Link href='/comfyrobe'>Se Comfyrobe</Link>
              </Button>

              <DialogClose
                render={
                  <Button
                    type='button'
                    variant='outline'
                    size='lg'
                    className='min-h-12 rounded-full border-input bg-transparent px-7 text-base text-popover-foreground hover:bg-accent hover:text-accent-foreground'
                  />
                }
              >
                Fortsett på siden
              </DialogClose>
            </div>
          </section>
        : <section className='overflow-hidden rounded-xl bg-popover text-popover-foreground'>
            <header className='relative isolate overflow-hidden bg-muted px-6 pt-8 pb-7 text-popover-foreground sm:px-9 sm:pt-10 sm:pb-9'>
              <div
                aria-hidden='true'
                className='absolute -top-20 -right-16 -z-10 size-56 rounded-full bg-popover-foreground/10 blur-3xl'
              />

              <div
                aria-hidden='true'
                className='absolute -bottom-24 -left-16 -z-10 size-56 rounded-full bg-accent/10 blur-3xl'
              />

              <DialogClose
                render={
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='absolute top-3 right-3 text-popover-foreground hover:bg-popover-foreground/10 hover:text-popover-foreground'
                  />
                }
              >
                <XIcon aria-hidden='true' />

                <span className='sr-only'>
                  Lukk nyhetsbrevmodalen
                </span>
              </DialogClose>

              <div className='mb-5 flex items-center gap-3'>
                <span
                  aria-hidden='true'
                  className='flex size-12 shrink-0 items-center justify-center rounded-2xl bg-alternate-button text-background'
                >
                  <Gift className='size-6' />
                </span>

                <span className='rounded-full border border-popover-foreground/25 bg-popover-foreground/10 px-3 py-1 font-utekos-text-medium text-xs tracking-[0.12em] text-popover-foreground uppercase'>
                  Kampanje
                </span>
              </div>

              <DialogHeader className='pr-8'>
                <DialogTitle className='font-utekos-text-medium text-3xl leading-[1.08] text-balance text-popover-foreground sm:text-4xl'>
                  {NEWSLETTER_DISCOUNT_PERCENT}% rabatt på
                  Comfyrobe™
                </DialogTitle>

                <DialogDescription className='max-w-lg text-base leading-7 text-popover-foreground/85'>
                  Meld deg på nyhetsbrevet og få allerede
                  nedsatte Comfyrobe™ for{' '}
                  <strong className='font-utekos-text-medium text-popover-foreground'>
                    kun kr 799,-{' '}
                  </strong>
                  . Rabattkoden sendes til e-postadressen din
                  etter registrering.
                </DialogDescription>
              </DialogHeader>
            </header>

            <form
              ref={formRef}
              action={handleSubmit}
              className='space-y-5 px-6 py-7 sm:px-9 sm:py-8'
            >
              <div className='space-y-2'>
                <label
                  htmlFor='newsletter-modal-email'
                  className='block font-utekos-text-medium text-sm text-popover-foreground'
                >
                  E-postadresse
                </label>

                <div className='relative'>
                  <Mail
                    aria-hidden='true'
                    className='pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground'
                  />

                  <Input
                    id='newsletter-modal-email'
                    name='email'
                    type='email'
                    inputMode='email'
                    autoComplete='email'
                    placeholder='din@epost.no'
                    required
                    autoFocus
                    aria-invalid={state.status === 'error'}
                    aria-describedby={emailDescription}
                    className='h-12 rounded-full border-input bg-popover pr-5 pl-12 text-base text-popover-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30 md:text-base'
                  />
                </div>

                <p
                  id='newsletter-modal-email-help'
                  className='text-sm leading-6 text-popover-foreground/70'
                >
                  Rabattkoden sendes til denne e-postadressen.
                </p>
              </div>

              {state.status === 'error' ?
                <p
                  id='newsletter-modal-error'
                  role='alert'
                  className='rounded-xl border border-destructive/25 bg-destructive px-4 py-3 text-sm leading-6 text-destructive-foreground'
                >
                  {state.message}
                </p>
              : null}

              <Button
                type='submit'
                variant='checkout'
                size='lg'
                disabled={isPending}
                aria-busy={isPending}
                className='min-h-12 w-full rounded-full bg-primary px-6 font-utekos-text-medium text-base text-foreground'
              >
                {isPending ?
                  <>
                    <Loader2
                      aria-hidden='true'
                      className='animate-spin'
                    />
                    Sender…
                  </>
                : <>Send meg rabattkoden</>}
              </Button>

              <p className='text-center font-utekos-text text-xs leading-5 tracking-tight text-popover-foreground/70'>
                Når du melder deg på, samtykker du til å motta
                nyheter og tilbud fra Utekos. Du kan melde deg av
                når som helst. Les vår{' '}
                <Link
                  href='/personvern'
                  className='font-utekos-text-medium text-popover-foreground underline underline-offset-4'
                >
                  personvernerklæring
                </Link>
                .
              </p>

              <DialogClose
                render={
                  <Button
                    type='button'
                    variant='secondary'
                    className='mx-auto flex text-secondary-foreground'
                  />
                }
              >
                Ikke nå
              </DialogClose>
            </form>
          </section>
        }
      </DialogContent>
    </Dialog>
  )
}
