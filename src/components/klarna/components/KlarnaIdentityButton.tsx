'use client'

import { Loader2 } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { loadKlarnaPublicConfig } from '@/components/klarna/utils/loadKlarnaPublicConfig'
import { loadKlarnaIdentitySdk } from '@/components/klarna/utils/loadKlarnaIdentitySdk'
import type { KlarnaIdentityButton as KlarnaIdentityButtonInstance } from '@/components/klarna/types/klarnaIdentity'

const KLARNA_IDENTITY_SCOPES = [
  'openid',
  'offline_access',
  'customer:login',
  'payment:request:create',
  'profile:name',
  'profile:email',
  'profile:phone',
  'profile:date_of_birth',
  'profile:billing_address',
  'profile:shipping_address',
  'profile:national_id',
  'profile:country',
  'profile:locale'
].join(' ')

export const KLARNA_IDENTITY_BUTTON_THEME = 'default' as const

export function KlarnaIdentityButton({
  onSignIn,
  width
}: {
  onSignIn: () => void
  width: CSSProperties['width']
}) {
  const reactId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const onSignInRef = useRef(onSignIn)
  const [status, setStatus] = useState<
    'loading' | 'ready' | 'error'
  >('loading')

  useEffect(() => {
    onSignInRef.current = onSignIn
  }, [onSignIn])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let active = true
    let button: KlarnaIdentityButtonInstance | undefined

    void loadKlarnaPublicConfig()
      .then(config =>
        loadKlarnaIdentitySdk({ clientId: config.client_id })
      )
      .then(klarna => {
        if (!active) return

        klarna.Identity.on('signin', async () => {
          if (!active) return
          onSignInRef.current()
        })
        klarna.Identity.on('error', async () => {
          if (!active) return
          setStatus('error')
        })

        button = klarna.Identity.button({
          clientType: 'public',
          id: `klarna-identity-${reactId.replaceAll(':', '')}`,
          locale: 'nb-NO',
          logoAlignment: 'default',
          redirectUri: `${window.location.origin}/klarna/identity/callback`,
          scope: KLARNA_IDENTITY_SCOPES,
          shape: 'default',
          theme: KLARNA_IDENTITY_BUTTON_THEME
        })
        button.on('render', async () => {
          if (active) setStatus('ready')
        })
        button.mount(container)
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })

    return () => {
      active = false
      button?.unmount()
    }
  }, [reactId])

  return (
    <div className='relative h-12 w-full' style={{ width }}>
      <div
        ref={containerRef}
        className={`h-12 w-full ${status === 'ready' ? 'visible' : 'invisible'}`}
        aria-busy={status === 'loading'}
      />

      {status === 'loading' ?
        <div
          role='status'
          aria-busy='true'
          className='absolute inset-0 flex h-12 items-center justify-center rounded-[4px] bg-[#FFA8CD] text-black'
        >
          {/* The original provider SVG is intentionally served unchanged. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src='/klarna_orig.svg'
            alt=''
            width={69}
            height={30}
            aria-hidden='true'
          />
          <Loader2
            aria-hidden='true'
            className='ml-2 size-4 animate-spin'
          />
          <span className='sr-only'>Laster Klarna</span>
        </div>
      : status === 'error' ?
        <div
          role='status'
          className='absolute inset-0 flex h-12 items-center justify-center rounded-[4px] border border-[#F0EEE9]/10 bg-[#012622] px-4 font-sans text-base font-medium text-[#F0EEE9]'
        >
          Klarna er ikke tilgjengelig
        </div>
      : null}
    </div>
  )
}
