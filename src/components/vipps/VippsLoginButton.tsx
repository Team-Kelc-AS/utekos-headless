'use client'

import Script from 'next/script'
import {
  createElement,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

const VIPPS_BUTTON_ELEMENT = 'vipps-mobilepay-button'
const VIPPS_BUTTON_SCRIPT =
  'https://cdn.vippsmobilepay.com/js/button/button.js'

export function VippsLoginButton() {
  const buttonRef = useRef<HTMLElement | null>(null)
  const [status, setStatus] = useState<
    'loading' | 'ready' | 'error'
  >('loading')

  const waitForButton = useCallback(() => {
    if (typeof window === 'undefined') return

    void window.customElements
      .whenDefined(VIPPS_BUTTON_ELEMENT)
      .then(() => setStatus('ready'))
      .catch(() => setStatus('error'))
  }, [])

  useEffect(() => {
    if (window.customElements.get(VIPPS_BUTTON_ELEMENT)) {
      waitForButton()
    }
  }, [waitForButton])

  useEffect(() => {
    const button = buttonRef.current
    if (!button || status !== 'ready') return

    const startLogin = () => {
      window.location.assign(
        new URL(
          '/api/identity/vipps/start',
          window.location.origin
        ).href
      )
    }
    button.addEventListener('click', startLogin)
    return () => button.removeEventListener('click', startLogin)
  }, [status])

  return (
    <div className='relative min-h-12 w-full'>
      <Script
        id='vipps-mobilepay-button-library'
        src={VIPPS_BUTTON_SCRIPT}
        strategy='afterInteractive'
        onLoad={waitForButton}
        onReady={waitForButton}
        onError={() => setStatus('error')}
      />

      {createElement(VIPPS_BUTTON_ELEMENT, {
        brand: 'vipps',
        className: `block min-h-12 w-full ${
          status === 'ready' ? 'visible' : 'invisible'
        }`,
        language: 'no',
        ref: buttonRef,
        stretched: 'true',
        variant: 'primary',
        verb: 'login'
      })}

      {status !== 'ready' ?
        <div
          role='status'
          aria-busy={status === 'loading'}
          className='absolute inset-0 flex min-h-12 items-center justify-center rounded-[4px] border border-[#F0EEE9]/10 bg-[#012622] px-4 font-sans text-base font-medium text-[#F0EEE9]'
        >
          {status === 'error' ?
            'Vipps er ikke tilgjengelig'
          : 'Laster Vipps'}
        </div>
      : null}
    </div>
  )
}
