'use client'

import { useState, useSyncExternalStore } from 'react'
import { KlarnaIdentityButton } from '@/components/klarna/components/KlarnaIdentityButton'
import { VippsLoginButton } from '@/components/vipps/VippsLoginButton'

type IdentityStatus =
  | 'vipps-connected'
  | 'vipps-cancelled'
  | 'vipps-error'
  | 'klarna-connected'
  | undefined

function readVippsStatus(): IdentityStatus {
  const result = new URLSearchParams(window.location.search).get(
    'vipps_login'
  )
  if (result === 'connected') return 'vipps-connected'
  if (result === 'cancelled') return 'vipps-cancelled'
  if (result === 'error' || result === 'unavailable') {
    return 'vipps-error'
  }
  return undefined
}

function subscribeToStaticLocation() {
  return () => undefined
}

function statusMessage(status: IdentityStatus) {
  if (status === 'vipps-connected') {
    return 'Identiteten din er bekreftet med Vipps.'
  }
  if (status === 'vipps-cancelled') {
    return 'Vipps-innloggingen ble avbrutt.'
  }
  if (status === 'vipps-error') {
    return 'Vipps-innloggingen kunne ikke fullføres. Prøv igjen.'
  }
  if (status === 'klarna-connected') {
    return 'Identiteten din er bekreftet med Klarna.'
  }
  return null
}

export function EmptyCartIdentityChoices({
  className = 'mt-8'
}: {
  className?: string
} = {}) {
  const vippsStatus = useSyncExternalStore(
    subscribeToStaticLocation,
    readVippsStatus,
    () => undefined
  )
  const [klarnaStatus, setKlarnaStatus] =
    useState<IdentityStatus>()
  const status = klarnaStatus ?? vippsStatus
  const message = statusMessage(status)

  return (
    <section
      aria-label='Innlogging'
      className={`rounded-lg border border-[#010B0A]/10 bg-white p-4 ${className}`}
    >
      <div className='space-y-3'>
        <VippsLoginButton />
        <KlarnaIdentityButton
          width='100%'
          onSignIn={() => setKlarnaStatus('klarna-connected')}
        />
      </div>

      {message ?
        <p
          aria-live='polite'
          className='mt-3 font-sans text-sm font-medium text-[#010B0A]'
        >
          {message}
        </p>
      : null}
    </section>
  )
}
