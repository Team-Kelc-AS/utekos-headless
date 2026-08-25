'use client'

export type FacebookAuthResponse = {
  accessToken: string
  expiresIn?: number
  userID: string
}

export type FacebookLoginStatusResponse = {
  authResponse?: FacebookAuthResponse
  status: 'connected' | 'not_authorized' | 'unknown'
}

export type FacebookJavaScriptSdk = {
  XFBML: {
    parse: (element?: HTMLElement, callback?: () => void) => void
  }
  getLoginStatus: (
    callback: (response: FacebookLoginStatusResponse) => void,
    force?: boolean
  ) => void
  init: (options: {
    appId: string
    cookie: boolean
    fedCM: { autoPrompt: boolean; context: 'signin' }
    status: boolean
    version: string
    xfbml: boolean
  }) => void
}

declare global {
  interface Window {
    FB?: FacebookJavaScriptSdk
    fbAsyncInit?: () => void
    utekosFacebookLoginOnLogin?: () => void
  }
}

const FACEBOOK_SDK_ELEMENT_ID = 'facebook-jssdk'
const FACEBOOK_SDK_URL =
  'https://connect.facebook.net/nb_NO/sdk.js'

let sdkPromise: Promise<FacebookJavaScriptSdk> | undefined
let initializedConfigKey: string | undefined

function initializeFacebookSdk(input: {
  apiVersion: string
  appId: string
}) {
  const sdk = window.FB
  if (!sdk) {
    throw new Error('facebook_login_sdk_missing')
  }

  const configKey = `${input.appId}:${input.apiVersion}`
  if (
    initializedConfigKey &&
    initializedConfigKey !== configKey
  ) {
    throw new Error('facebook_login_sdk_config_mismatch')
  }

  if (!initializedConfigKey) {
    sdk.init({
      appId: input.appId,
      cookie: true,
      fedCM: { autoPrompt: false, context: 'signin' },
      status: false,
      version: input.apiVersion,
      xfbml: false
    })
    initializedConfigKey = configKey
  }

  return sdk
}

export function loadFacebookJavaScriptSdk(input: {
  apiVersion: string
  appId: string
}): Promise<FacebookJavaScriptSdk> {
  if (typeof window === 'undefined') {
    return Promise.reject(
      new Error('facebook_login_sdk_browser_required')
    )
  }

  if (window.FB) {
    try {
      return Promise.resolve(initializeFacebookSdk(input))
    } catch (error) {
      return Promise.reject(error)
    }
  }

  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    const previousAsyncInit = window.fbAsyncInit
    window.fbAsyncInit = () => {
      try {
        previousAsyncInit?.()
        resolve(initializeFacebookSdk(input))
      } catch (error) {
        reject(error)
      }
    }

    const existingScript = document.getElementById(
      FACEBOOK_SDK_ELEMENT_ID
    )
    if (existingScript) return

    const script = document.createElement('script')
    script.id = FACEBOOK_SDK_ELEMENT_ID
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.src = FACEBOOK_SDK_URL
    script.onerror = () => {
      sdkPromise = undefined
      reject(new Error('facebook_login_sdk_load_failed'))
    }
    document.head.appendChild(script)
  })

  return sdkPromise
}
