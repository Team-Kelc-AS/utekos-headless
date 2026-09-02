'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { FacebookLoginChoices } from '@/components/facebook-login/FacebookLoginChoices'
import type { FacebookLoginClientConfig } from '@/lib/facebook-login/facebookLoginConfig'
import {
  detectFacebookLoginTraffic,
  isFacebookLoginManualPreview,
  isFacebookLoginPromptActive,
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
const FACEBOOK_BUTTON_MAX_WIDTH = 400
const FACEBOOK_BUTTON_MIN_WIDTH = 240
const PAGE_EDGE_GAP_PX = 32

const statusResponseSchema = z.strictObject({
  connected: z.boolean().optional(),
  linked: z.boolean().optional(),
  needs_contact: z.boolean().optional()
})

const completeResponseSchema = z.strictObject({
  status: z.enum(['connected', 'needs_contact'])
})

type PromptState = 'hidden' | 'login' | 'error'

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

  if (value === 'connected' || value === 'needs_contact') {
    return 'hidden'
  }
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
  const [pending, setPending] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [buttonRendered, setButtonRendered] = useState(false)
  const [loginUnavailable, setLoginUnavailable] = useState(false)
  const [buttonWidth, setButtonWidth] = useState(
    FACEBOOK_BUTTON_MAX_WIDTH
  )

  const excluded = isExcludedPath(pathname)
  const visualPreview =
    previewAllowed &&
    process.env.NODE_ENV === 'development' &&
    !clientConfig

  useEffect(() => {
    const updateButtonWidth = () => {
      setButtonWidth(
        Math.max(
          FACEBOOK_BUTTON_MIN_WIDTH,
          Math.min(
            FACEBOOK_BUTTON_MAX_WIDTH,
            Math.floor(window.innerWidth - PAGE_EDGE_GAP_PX)
          )
        )
      )
    }

    updateButtonWidth()
    window.addEventListener('resize', updateButtonWidth)
    return () =>
      window.removeEventListener('resize', updateButtonWidth)
  }, [])

  useEffect(() => {
    const activeOnCurrentHost = isFacebookLoginPromptActive({
      enabled,
      hostname: window.location.hostname,
      previewAllowed
    })
    const manualPreview =
      activeOnCurrentHost &&
      isFacebookLoginManualPreview({
        hostname: window.location.hostname,
        pageUrl: window.location.href
      })
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
        if (
          status?.linked ||
          status?.connected ||
          status?.needs_contact
        ) {
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
      if (visualPreview) return

      const unavailableTimer = window.setTimeout(() => {
        setLoginUnavailable(true)
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
                trackFacebookLoginFunnel({
                  stage: 'login_error',
                  surface: 'prompt',
                  trafficSignal: trafficSignalRef.current
                })
                return
              }

              setPending(true)
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
                  setState('hidden')
                })
                .catch(() => {
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
        setSdkReady(false)
        setButtonRendered(false)
        setLoginUnavailable(true)
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
  }, [clientConfig, state, visualPreview])

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

  return (
    <FacebookLoginChoices
      buttonWidth={buttonWidth}
      buttonContainerRef={buttonContainerRef}
      buttonRendered={buttonRendered}
      loginUnavailable={loginUnavailable}
      onContinueWithoutFacebook={dismiss}
      pending={pending}
      sdkReady={sdkReady}
      visualPreview={visualPreview}
    />
  )
}
