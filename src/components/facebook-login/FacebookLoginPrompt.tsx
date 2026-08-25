'use client'

import { Loader2, XIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { FacebookLoginClientConfig } from '@/lib/facebook-login/facebookLoginConfig'
import {
  detectFacebookLoginTraffic,
  isFacebookLoginManualPreview,
  isFacebookLoginPreviewHostname,
  type FacebookLoginTrafficSignal
} from '@/lib/facebook-login/facebookLoginTraffic'
import {
  loadFacebookJavaScriptSdk,
  type FacebookJavaScriptSdk,
  type FacebookLoginStatusResponse
} from '@/lib/facebook-login/loadFacebookJavaScriptSdk'
import { trackFacebookLoginFunnel } from '@/lib/facebook-login/trackFacebookLoginFunnel'

const DISMISSED_SESSION_KEY =
  'utekos-facebook-login-prompt-dismissed'
const OPEN_DELAY_MS = 650

const statusResponseSchema = z.strictObject({
  connected: z.boolean().optional(),
  linked: z.boolean().optional(),
  needs_contact: z.boolean().optional()
})

const completeResponseSchema = z.strictObject({
  status: z.enum(['connected', 'needs_contact'])
})

type PromptState =
  | 'hidden'
  | 'login'
  | 'needs_contact'
  | 'connected'
  | 'error'

type PromptTrafficSignal = FacebookLoginTrafficSignal | 'preview'

function isExcludedPath(pathname: string | null) {
  if (!pathname) return false

  return [
    '/api',
    '/customer/account/callback',
    '/design',
    '/personvern'
  ].some(
    excluded =>
      pathname === excluded ||
      pathname.startsWith(`${excluded}/`)
  )
}

function readCallbackState(): PromptState | undefined {
  const value = new URL(window.location.href).searchParams.get(
    'facebook_login'
  )

  if (value === 'connected') return 'connected'
  if (value === 'needs_contact') return 'needs_contact'
  if (value === 'error') return 'error'
  return undefined
}

function clearCallbackState() {
  const url = new URL(window.location.href)
  if (!url.searchParams.has('facebook_login')) return

  url.searchParams.delete('facebook_login')
  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`
  )
}

function wasDismissed() {
  try {
    return (
      window.sessionStorage.getItem(DISMISSED_SESSION_KEY) ===
      '1'
    )
  } catch {
    return false
  }
}

function persistDismissal() {
  try {
    window.sessionStorage.setItem(DISMISSED_SESSION_KEY, '1')
  } catch {}
}

function currentReturnTo() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

export function FacebookLoginPrompt({
  clientConfig,
  enabled,
  previewAllowed
}: {
  clientConfig: FacebookLoginClientConfig | undefined
  enabled: boolean
  previewAllowed: boolean
}) {
  const pathname = usePathname()
  const buttonContainerRef = useRef<HTMLDivElement>(null)
  const sdkRef = useRef<FacebookJavaScriptSdk | null>(null)
  const trafficSignalRef = useRef<PromptTrafficSignal>(undefined)
  const promptViewTrackedRef = useRef(false)
  const buttonRenderedTrackedRef = useRef(false)
  const [state, setState] = useState<PromptState>('hidden')
  const [contact, setContact] = useState('')
  const [pending, setPending] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [buttonRendered, setButtonRendered] = useState(false)
  const [sdkAttempt, setSdkAttempt] = useState(0)
  const [message, setMessage] = useState('')

  const excluded = isExcludedPath(pathname)

  useEffect(() => {
    const previewHostname = isFacebookLoginPreviewHostname(
      window.location.hostname
    )
    const manualPreview =
      previewAllowed &&
      isFacebookLoginManualPreview({
        hostname: window.location.hostname,
        pageUrl: window.location.href
      })
    const activeOnCurrentHost =
      (enabled && !previewHostname) ||
      (previewAllowed && previewHostname)

    if (!activeOnCurrentHost || excluded) {
      return
    }

    let disposed = false

    const callbackState = readCallbackState()
    if (callbackState) {
      clearCallbackState()
      trafficSignalRef.current =
        manualPreview ? 'preview' : undefined
      const callbackTimer = window.setTimeout(() => {
        if (!disposed) setState(callbackState)
      }, 0)

      return () => {
        disposed = true
        window.clearTimeout(callbackTimer)
      }
    }

    const signal = detectFacebookLoginTraffic({
      cookieHeader: document.cookie,
      pageUrl: window.location.href,
      referrer: document.referrer
    })

    if (
      (!signal && !manualPreview) ||
      (!manualPreview && wasDismissed())
    ) {
      return
    }

    trafficSignalRef.current = manualPreview ? 'preview' : signal

    if (manualPreview) {
      const previewTimer = window.setTimeout(
        () => setState('login'),
        OPEN_DELAY_MS
      )

      return () => {
        disposed = true
        window.clearTimeout(previewTimer)
      }
    }

    void fetch('/api/identity/facebook/status', {
      cache: 'no-store',
      credentials: 'same-origin'
    })
      .then(async response => {
        if (!response.ok) return undefined
        return statusResponseSchema.parse(await response.json())
      })
      .then(status => {
        if (disposed) return
        if (status?.needs_contact) {
          setState('needs_contact')
          return
        }
        if (status?.linked) return

        window.setTimeout(() => {
          if (!disposed) setState('login')
        }, OPEN_DELAY_MS)
      })
      .catch(() => {
        if (!disposed) {
          window.setTimeout(
            () => setState('login'),
            OPEN_DELAY_MS
          )
        }
      })

    return () => {
      disposed = true
    }
  }, [enabled, excluded, pathname, previewAllowed])

  useEffect(() => {
    if (
      (state !== 'login' && state !== 'error') ||
      promptViewTrackedRef.current
    ) {
      return
    }

    promptViewTrackedRef.current = true
    trackFacebookLoginFunnel({
      stage: 'prompt_view',
      surface: 'prompt',
      trafficSignal: trafficSignalRef.current
    })
  }, [state])

  useEffect(() => {
    if (state !== 'login' && state !== 'error') return

    if (!clientConfig) {
      const unavailableTimer = window.setTimeout(() => {
        setMessage(
          'Facebook-innlogging er ikke tilgjengelig i denne previewen.'
        )
        trackFacebookLoginFunnel({
          stage: 'login_error',
          surface: 'prompt',
          trafficSignal: trafficSignalRef.current
        })
      }, 0)
      return () => window.clearTimeout(unavailableTimer)
    }

    let disposed = false

    const prepare = fetch('/api/identity/facebook/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnTo: currentReturnTo() }),
      cache: 'no-store',
      credentials: 'same-origin'
    }).then(response => {
      if (!response.ok) {
        throw new Error('facebook_login_prepare_failed')
      }
    })

    void Promise.all([
      prepare,
      loadFacebookJavaScriptSdk(clientConfig)
    ])
      .then(([, sdk]) => {
        if (disposed) return

        sdkRef.current = sdk
        const onLogin = () => {
          sdk.getLoginStatus(
            (response: FacebookLoginStatusResponse) => {
              if (
                response.status !== 'connected' ||
                !response.authResponse?.accessToken ||
                !response.authResponse.userID
              ) {
                setMessage(
                  'Innloggingen ble ikke fullført. Du kan prøve igjen.'
                )
                trackFacebookLoginFunnel({
                  stage: 'login_error',
                  surface: 'prompt',
                  trafficSignal: trafficSignalRef.current
                })
                return
              }

              setPending(true)
              setMessage('')
              void fetch('/api/identity/facebook/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  accessToken: response.authResponse.accessToken,
                  userID: response.authResponse.userID
                }),
                cache: 'no-store',
                credentials: 'same-origin'
              })
                .then(async completeResponse => {
                  if (!completeResponse.ok) {
                    throw new Error(
                      'facebook_login_complete_failed'
                    )
                  }
                  return completeResponseSchema.parse(
                    await completeResponse.json()
                  )
                })
                .then(result => {
                  trackFacebookLoginFunnel({
                    stage: 'login_completed',
                    surface: 'prompt',
                    trafficSignal: trafficSignalRef.current
                  })
                  if (result.status === 'needs_contact') {
                    trackFacebookLoginFunnel({
                      stage: 'contact_required',
                      surface: 'prompt',
                      trafficSignal: trafficSignalRef.current
                    })
                  }
                  setState(result.status)
                })
                .catch(() => {
                  setMessage(
                    'Facebook-tilkoblingen kunne ikke fullføres. Prøv igjen.'
                  )
                  trackFacebookLoginFunnel({
                    stage: 'login_error',
                    surface: 'prompt',
                    trafficSignal: trafficSignalRef.current
                  })
                })
                .finally(() => setPending(false))
            },
            true
          )
        }

        window.utekosFacebookLoginOnLogin = onLogin
        setSdkReady(true)
        trackFacebookLoginFunnel({
          stage: 'sdk_ready',
          surface: 'prompt',
          trafficSignal: trafficSignalRef.current
        })
      })
      .catch(() => {
        if (disposed) return
        setMessage(
          'Facebook-innlogging kunne ikke lastes. Prøv igjen.'
        )
        trackFacebookLoginFunnel({
          stage: 'login_error',
          surface: 'prompt',
          trafficSignal: trafficSignalRef.current
        })
      })

    return () => {
      disposed = true
      sdkRef.current = null
      delete window.utekosFacebookLoginOnLogin
    }
  }, [clientConfig, sdkAttempt, state])

  useEffect(() => {
    if (!sdkReady || (state !== 'login' && state !== 'error')) {
      return
    }

    const container = buttonContainerRef.current
    const sdk = sdkRef.current
    if (!container || !sdk) return

    let disposed = false

    sdk.XFBML.parse(container, () => {
      if (disposed) return

      setButtonRendered(true)
      if (buttonRenderedTrackedRef.current) return
      buttonRenderedTrackedRef.current = true
      trackFacebookLoginFunnel({
        stage: 'button_rendered',
        surface: 'prompt',
        trafficSignal: trafficSignalRef.current
      })
    })

    return () => {
      disposed = true
    }
  }, [sdkReady, state])

  useEffect(() => {
    if (state !== 'connected') return

    const timer = window.setTimeout(
      () => setState('hidden'),
      4500
    )
    return () => window.clearTimeout(timer)
  }, [state])

  if (excluded || state === 'hidden') return null

  const dismiss = () => {
    persistDismissal()
    trackFacebookLoginFunnel({
      stage: 'dismissed',
      surface: 'prompt',
      trafficSignal: trafficSignalRef.current
    })
    setState('hidden')
  }

  const submitContact = async (
    event: SubmitEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    if (pending) return

    setPending(true)
    setMessage('')

    try {
      const response = await fetch(
        '/api/identity/facebook/contact',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contact }),
          cache: 'no-store',
          credentials: 'same-origin'
        }
      )

      if (!response.ok) {
        setMessage(
          response.status === 400 ?
            'Skriv inn en gyldig e-postadresse eller et mobilnummer.'
          : 'Kunne ikke lagre akkurat nå. Prøv igjen.'
        )
        return
      }

      trackFacebookLoginFunnel({
        stage: 'contact_submitted',
        surface: 'prompt',
        trafficSignal: trafficSignalRef.current
      })
      setState('connected')
      setContact('')
    } catch {
      setMessage('Kunne ikke lagre akkurat nå. Prøv igjen.')
    } finally {
      setPending(false)
    }
  }

  return (
    <aside
      role='dialog'
      aria-modal='false'
      aria-labelledby='facebook-login-title'
      className='fixed right-4 bottom-4 left-4 z-120 mx-auto w-auto max-w-sm rounded-3xl border border-border/80 bg-popover p-5 text-popover-foreground shadow-2xl sm:p-6'
    >
      <Button
        type='button'
        variant='utekos'
        size='icon'
        onClick={dismiss}
        className='absolute top-2 right-2 rounded-full text-facebook-login-button'
      >
        Fortsett uten å logge inn
      </Button>

  
        <form onSubmit={submitContact} className='pr-3'>
          <h2
            id='facebook-login-title'
            className='pr-7 font-sans text-xl font-semibold'
          >
            Legg til kontaktinformasjon
          </h2>
          <label
            htmlFor='facebook-login-contact'
            className='mt-4 block text-sm font-medium'
          >
            E-post eller mobilnummer
          </label>
          <Input
            id='facebook-login-contact'
            value={contact}
            onChange={event => setContact(event.target.value)}
            autoComplete='username'
            inputMode='text'
            required
            maxLength={320}
            className='mt-2 h-11 rounded-full'
          />
          {message ?
            <p
              role='alert'
              className='mt-2 text-sm text-destructive'
            >
              {message}
            </p>
          : null}
          <Button
            type='submit'
            disabled={pending}
            className='mt-4 min-h-11 w-full rounded-full'
          >
            {pending ?
              <Loader2
                aria-hidden='true'
                className='animate-spin'
              />
            : null}
            Lagre og fortsett
          </Button>
          <button
            type='button'
            onClick={dismiss}
            className='mt-3 w-full text-center text-sm underline underline-offset-4'
          >
            Fortsett uten
          </button>
        </form>
      : <div>

          <div
            ref={buttonContainerRef}
            aria-busy={!buttonRendered}
            className='relative mt-5 h-10 w-full overflow-hidden rounded-md'
          >
            {sdkReady ?
              <div
                className={`h-10 w-full overflow-hidden ${
                  buttonRendered ? 'visible' : 'invisible'
                }`}
              >
                <div
                  className='fb-login-button w-full'
                  data-width='100%'
                  data-size='large'
                  data-button-type='continue_with'
                  data-layout='default'
                  data-auto-logout-link='false'
                  data-use-continue-as='true'
                  data-scope='public_profile,email'
                  data-onlogin='utekosFacebookLoginOnLogin();'
                />
              </div>
            : null}

            {!buttonRendered ?
              <div
                aria-hidden='true'
                className='absolute inset-0 h-10 w-full animate-pulse rounded-md bg-facebook-login-button'
              >
                <div className='absolute inset-0 h-10 w-full animate-pulse rounded-md bg-facebook-login-button/20'>
                  <Loader2
                    aria-hidden='true'
                    className='animate-spin'
                  />
                </div>
              </div>
            : null}
          </div>

          {pending ?
            <p
              aria-live='polite'
              className='mt-3 flex items-center justify-center gap-2 text-sm'
            >
              <Loader2
                aria-hidden='true'
                className='animate-spin'
              />
              Fullfører innloggingen
            </p>
          : null}

          {message ?
            <div className='mt-3 text-center'>
              <p
                role='alert'
                className='text-sm text-destructive'
              >
                {message}
              </p>
                <Button
                  variant="utekos"
                  onClick={() => {
                    setMessage('')
                    setButtonRendered(false)
                    setSdkReady(false)
                    setSdkAttempt(value => value + 1)
                  }}
                  className='mt-2 text-sm'
                >
                  Prøv igjen
                </Button>
              </div>
            : null}

          <Button
            variant='utekos'
            onClick={dismiss}
            className='mt-4 w-full text-center'
          >
            Fortsett uten å logge inn
          </Button>
        </div>  
    </aside>
  )
}
