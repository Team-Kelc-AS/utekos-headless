'use client'

import { Loader2 } from 'lucide-react'
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

export function KlarnaIdentityButton({
  onSignIn,
  width
}: {
  onSignIn: () => void
  width: number
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
          theme: 'outlined'
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
    <div
      className='relative h-12 w-full overflow-hidden rounded-[4px]'
      style={{ width }}
    >
      <div
        ref={containerRef}
        id='klarna-identity-button-container'
        className={`h-12 w-full ${status === 'ready' ? 'visible' : 'invisible'}`}
        aria-busy={status === 'loading'}
      />

      {status !== 'ready' ?
        <div
          role='status'
          className='absolute inset-0 flex h-12 items-center justify-center rounded-[4px] border border-[#0B051D] bg-[#F9F8F5] font-sans font-semibold text-base text-[#0B051D]'
        >
          {status === 'error' ?
            'Klarna er ikke tilgjengelig'
          : <>
              <Loader2
                aria-hidden='true'
                className='mr-2 size-4 animate-spin'
              />
              Laster Klarna
            </>}
        </div>
      : null}
    </div>
  )
}
