'use client'

import { Loader2, XIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { detectFacebookLoginTraffic } from '@/lib/facebook-login/facebookLoginTraffic'

const DISMISSED_SESSION_KEY =
  'utekos-facebook-login-prompt-dismissed'
const OPEN_DELAY_MS = 650

type PromptState =
  | 'hidden'
  | 'login'
  | 'needs_contact'
  | 'connected'
  | 'error'

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

export function FacebookLoginPrompt({
  enabled
}: {
  enabled: boolean
}) {
  const pathname = usePathname()
  const [state, setState] = useState<PromptState>('hidden')
  const [contact, setContact] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  const excluded = isExcludedPath(pathname)

  useEffect(() => {
    if (!enabled || excluded) return

    let disposed = false

    const callbackState = readCallbackState()
    if (callbackState) {
      clearCallbackState()
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

    if (!signal || wasDismissed()) return

    void fetch('/api/identity/facebook/status', {
      cache: 'no-store',
      credentials: 'same-origin'
    })
      .then(async response => {
        if (!response.ok) return undefined
        return (await response.json()) as {
          connected?: boolean
          needs_contact?: boolean
        }
      })
      .then(status => {
        if (disposed || status?.connected) return
        if (status?.needs_contact) {
          setState('needs_contact')
          return
        }

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
  }, [enabled, excluded, pathname])

  useEffect(() => {
    if (state !== 'connected') return

    const timer = window.setTimeout(
      () => setState('hidden'),
      4500
    )
    return () => window.clearTimeout(timer)
  }, [state])

  if (!enabled || excluded || state === 'hidden') return null

  const dismiss = () => {
    persistDismissal()
    setState('hidden')
  }

  const beginLogin = () => {
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const startUrl = new URL(
      '/api/identity/facebook/start',
      window.location.origin
    )
    startUrl.searchParams.set('return_to', returnTo)
    window.location.assign(startUrl.href)
  }

  const submitContact = async (
    event: FormEvent<HTMLFormElement>
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
      className='fixed top-1/2 right-4 left-4 z-[120] mx-auto w-auto max-w-md -translate-y-1/2 rounded-3xl border border-border/80 bg-popover p-6 text-popover-foreground shadow-2xl sm:p-7'
    >
      <Button
        type='button'
        variant='ghost'
        size='icon'
        onClick={dismiss}
        className='absolute top-2 right-2 rounded-full'
      >
        <XIcon aria-hidden='true' />
        <span className='sr-only'>Lukk</span>
      </Button>

      {state === 'connected' ?
        <div aria-live='polite' className='pr-8'>
          <p
            id='facebook-login-title'
            className='font-sans text-lg font-semibold'
          >
            Velkommen til Utekos!
          </p>
        </div>
      : state === 'needs_contact' ?
        <form onSubmit={submitContact} className='pr-3'>
          <h2
            id='facebook-login-title'
            className='pr-7 font-sans text-xl font-semibold'
          >
            Ett siste felt
          </h2>
          <p className='mt-2 text-sm leading-6 text-popover-foreground/75'>
            Facebook delte ingen e-post. Legg inn én kontaktmåte
            for en mer relevant handleopplevelse.
          </p>
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
      : <div className='pr-3'>
          <h2
            id='facebook-login-title'
            className='pr-7 font-sans text-xl font-semibold'
          >
            Velkommen fra Facebook
          </h2>
          <p className='mt-2 text-sm leading-6 text-popover-foreground/75'>
            Fortsett enkelt fra annonsen til en mer
            sammenhengende handleopplevelse hos Utekos.
          </p>
          {state === 'error' ?
            <p
              role='alert'
              className='mt-3 text-sm text-destructive'
            >
              Facebook-tilkoblingen ble ikke fullført. Du kan
              prøve igjen eller fortsette uten.
            </p>
          : null}
          <Button
            type='button'
            onClick={beginLogin}
            className='mt-4 min-h-11 w-full rounded-full bg-[#1877F2] text-white hover:bg-[#166FE5]'
          >
            <span
              aria-hidden='true'
              className='flex size-5 items-center justify-center rounded-full bg-white font-sans text-sm font-bold text-[#1877F2]'
            >
              f
            </span>
            Fortsett med Facebook
          </Button>
          <button
            type='button'
            onClick={dismiss}
            className='mt-3 w-full text-center text-sm underline underline-offset-4'
          >
            Ikke nå
          </button>
          <p className='mt-3 text-xs leading-5 text-popover-foreground/60'>
            Frivillig. Butikken fungerer uten innlogging. Vi ber
            bare om offentlig profil og e-post.
          </p>
        </div>
      }
    </aside>
  )
}
