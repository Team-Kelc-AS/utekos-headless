'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { loadFacebookJavaScriptSdk } from '@/lib/facebook-login/loadFacebookJavaScriptSdk'

declare global {
  interface Window {
    utekosWishlistFacebookOnLogin?: () => void
  }
}

export function WishlistFacebookLogin({
  returnTo
}: {
  returnTo: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<
    'loading' | 'ready' | 'pending' | 'connected' | 'error'
  >('loading')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let disposed = false
    let pending = false
    let loginStarted = false
    let completionTimeout: number | undefined
    let resizeObserver: ResizeObserver | undefined
    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      controller.abort()
      if (!disposed) setState('error')
    }, 15000)

    const prepare = async () => {
      const response = await fetch(
        '/api/identity/facebook/prepare',
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ returnTo }),
          signal: controller.signal
        }
      )
      if (!response.ok) throw new Error('facebook_unavailable')
      const { clientConfig } = await response.json()
      const sdk = await loadFacebookJavaScriptSdk(clientConfig)
      if (disposed || controller.signal.aborted) return

      window.utekosWishlistFacebookOnLogin = () => {
        if (disposed || pending) return
        pending = true
        loginStarted = true
        setState('pending')
        completionTimeout = window.setTimeout(() => {
          controller.abort()
          if (!disposed) setState('error')
        }, 15000)
        sdk.getLoginStatus(response => {
          if (disposed || controller.signal.aborted) return
          const auth = response.authResponse
          if (response.status !== 'connected' || !auth) {
            window.clearTimeout(completionTimeout)
            pending = false
            setState('error')
            return
          }
          void fetch('/api/identity/facebook/complete', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessToken: auth.accessToken,
              userID: auth.userID
            }),
            signal: controller.signal
          })
            .then(async result => {
              if (!result.ok)
                throw new Error('facebook_login_failed')
              const body = await result.json()
              if (
                !['connected', 'needs_contact'].includes(
                  body.status
                )
              ) {
                throw new Error('facebook_login_failed')
              }
              if (!disposed) setState('connected')
            })
            .catch(() => {
              if (!disposed) setState('error')
            })
            .finally(() => {
              window.clearTimeout(completionTimeout)
              pending = false
            })
        }, true)
      }

      let previousWidth = 0
      const renderButton = () => {
        const width = Math.min(
          400,
          Math.floor(container.clientWidth)
        )
        if (
          disposed ||
          loginStarted ||
          width === previousWidth ||
          width < 240
        )
          return
        previousWidth = width
        const button = document.createElement('div')
        button.className = 'fb-login-button'
        button.setAttribute('data-size', 'large')
        button.setAttribute('data-width', String(width))
        button.setAttribute('data-button-type', 'continue_with')
        button.setAttribute('data-use-continue-as', 'true')
        button.setAttribute('data-auto-logout-link', 'false')
        button.setAttribute('data-scope', 'public_profile,email')
        button.setAttribute(
          'data-onlogin',
          'utekosWishlistFacebookOnLogin();'
        )
        container.replaceChildren(button)
        sdk.XFBML.parse(container, () => {
          window.clearTimeout(timeout)
          if (
            !disposed &&
            !loginStarted &&
            !controller.signal.aborted
          )
            setState('ready')
        })
      }
      renderButton()
      resizeObserver = new ResizeObserver(renderButton)
      resizeObserver.observe(container)
    }

    void prepare().catch(() => {
      window.clearTimeout(timeout)
      window.clearTimeout(completionTimeout)
      resizeObserver?.disconnect()
      if (!disposed) setState('error')
    })
    return () => {
      disposed = true
      controller.abort()
      window.clearTimeout(timeout)
      window.clearTimeout(completionTimeout)
      resizeObserver?.disconnect()
      delete window.utekosWishlistFacebookOnLogin
      container.replaceChildren()
    }
  }, [attempt, returnTo])

  return (
    <div className='min-w-0 space-y-3'>
      <div className='relative mx-auto min-h-10 w-full max-w-100 min-w-0'>
        <div
          ref={containerRef}
          className={
            state === 'ready' ? 'min-h-10' : (
              'invisible h-0 overflow-hidden'
            )
          }
        />
        {state === 'loading' || state === 'pending' ?
          <p
            role='status'
            className='flex min-h-10 items-center justify-center rounded-md bg-facebook-login-button px-3 text-sm font-semibold text-white'
          >
            {state === 'pending' ?
              'Fullfører med Facebook …'
            : 'Laster Facebook …'}
          </p>
        : null}
      </div>
      {state === 'error' ?
        <div
          role='alert'
          className='space-y-2 text-sm text-foreground'
        >
          <p>
            Facebook kunne ikke lastes eller innloggingen ble
            avbrutt. Prøv igjen eller fortsett med e-post.
          </p>
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              setState('loading')
              setAttempt(value => value + 1)
            }}
          >
            Prøv Facebook igjen
          </Button>
        </div>
      : state === 'connected' ?
        <div
          role='status'
          className='space-y-2 text-sm text-foreground'
        >
          <p>
            Facebook er tilkoblet. Bruk e-post nedenfor for å
            åpne kundekontoen din.
          </p>
          <a
            href='/personvern#facebook-tilkobling'
            className='inline-flex min-h-11 items-center underline underline-offset-4'
          >
            Administrer Facebook-tilkobling
          </a>
        </div>
      : null}
    </div>
  )
}
