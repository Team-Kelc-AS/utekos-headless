'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  useActionState,
  useEffect,
  useRef,
  useState
} from 'react'
import { Check, Loader2, Mail, Sparkles, XIcon } from 'lucide-react'

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
import newsletterImageComfyKlarna from '@/assets/images/partners/newsletter-image-comfy-klarna.png'
import newsletterImageComfyKlarna2 from '@/assets/images/partners/newsletter-image-comfy-klarna.webp'


const initialState: ActionState = { status: 'idle', message: '' }

const OPEN_DELAY_MS = 3500
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
        className={
          state.status === 'success' ?
            'max-h-[calc(100svh-2rem)] overflow-y-auto bg-transparent p-0 ring-0 sm:max-w-xl'
          : 'max-h-[calc(100svh-2rem)] overflow-y-auto bg-transparent p-0 ring-0 sm:max-w-lg lg:w-[calc(100%-2rem)] lg:max-w-5xl'
        }
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
              <DialogTitle className='font-sans text-2xl leading-tight text-popover-foreground sm:text-3xl'>
                Rabattkoden er på vei
              </DialogTitle>

              <DialogDescription className='max-w-md font-utekos-text-medium text-base leading-7 text-popover-foreground/80'>
                {state.message}
              </DialogDescription>
            </DialogHeader>

            <p className='mx-auto mt-4 max-w-md font-utekos-text text-sm leading-6 text-popover-foreground/70'>
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
        : <section className='rounded-xl bg-popover font-utekos-text text-popover-foreground lg:grid lg:grid-cols-2'>
            <div className='relative min-w-0 overflow-hidden bg-muted lg:aspect-[4/5]'>
              <Image
                src={newsletterImageComfyKlarna}
                alt='Marineblå Comfyrobe. Velg Klarna i kassen.'
                width={1000}
                height={1000}
                sizes='(max-width: 639px) calc(100vw - 2rem), 32rem'
                priority
                className='aspect-square h-auto w-full object-cover lg:hidden'
              />

              <Image
                src={newsletterImageComfyKlarna2}
                alt='Marineblå Comfyrobe. Velg Klarna i kassen.'
                fill
                sizes='(max-width: 1279px) 496px, 512px'
                priority
                className='hidden object-cover lg:block'
              />
            </div>

            <div className='relative flex min-w-0 flex-col'>
              <DialogClose
                render={
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='absolute top-3 right-3 z-10 text-popover-foreground hover:bg-accent hover:text-accent-foreground'
                  />
                }
              >
                <XIcon aria-hidden='true' />

                <span className='sr-only'>
                  Lukk nyhetsbrevmodalen
                </span>
              </DialogClose>

              <header className='px-5 pt-6 sm:px-8 sm:pt-10 sm:pr-10 lg:px-10'>
                <DialogHeader className='pr-8'>
                  <DialogTitle className='font-sans text-2xl leading-[1.08] text-balance text-popover-foreground sm:text-3xl lg:text-4xl'>
                    {NEWSLETTER_DISCOUNT_PERCENT}% rabatt på
                    Comfyrobe™
                  </DialogTitle>

                  <DialogDescription className='max-w-lg font-utekos-text-medium text-sm leading-6 text-popover-foreground/85 sm:text-base sm:leading-7'>
                    Meld deg på nyhetsbrevet og få allerede
                    nedsatte Comfyrobe™ for{' '}
                    <strong className='text-popover-foreground'>
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
                className='flex flex-1 flex-col gap-4 px-5 py-6 sm:gap-5 sm:px-8 sm:py-8 lg:px-10'
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
                      className='h-12 rounded-full border-input bg-popover pr-5 pl-12 font-utekos-text text-base text-popover-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30 md:text-base'
                    />
                  </div>

                  <p
                    id='newsletter-modal-email-help'
                    className='font-utekos-text text-sm leading-6 text-popover-foreground/70'
                  >
                    Rabattkoden sendes til denne e-postadressen.
                  </p>
                </div>

                {state.status === 'error' ?
                  <p
                    id='newsletter-modal-error'
                    role='alert'
                    className='rounded-xl border border-destructive/25 bg-destructive px-4 py-3 font-utekos-text text-sm leading-6 text-destructive-foreground'
                  >
                    {state.message}
                  </p>
                : null}

                <div className='mt-auto space-y-5'>
                  <div className='space-y-3'>
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

                    <DialogClose
                      render={
                        <Button
                          type='button'
                          variant='outline'
                          size='lg'
                          className='min-h-12 w-full rounded-full border-input bg-transparent px-6 font-utekos-text-medium text-base text-popover-foreground hover:bg-accent hover:text-accent-foreground'
                        />
                      }
                    >
                      Nei, takk
                    </DialogClose>
                  </div>

                  <p className='text-center font-utekos-text text-xs leading-5 tracking-tight text-popover-foreground/70'>
                    Når du melder deg på, samtykker du til å
                    motta nyheter og tilbud fra Utekos. Du kan
                    melde deg av når som helst. Les vår{' '}
                    <Link
                      href='/personvern'
                      className='font-utekos-text-medium text-popover-foreground underline underline-offset-4'
                    >
                      personvernerklæring
                    </Link>
                    .
                  </p>
                </div>
              </form>
            </div>
          </section>
        }
      </DialogContent>
    </Dialog>
  )
}
