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

export function EmptyCartIdentityChoices() {
  const vippsStatus = useSyncExternalStore(
    subscribeToStaticLocation,
    readVippsStatus,
    () => undefined
  )
  const [klarnaStatus, setKlarnaStatus] =
    useState<IdentityStatus>()
  const status = klarnaStatus ?? vippsStatus

  return (
    <section
      aria-labelledby='empty-cart-identity-title'
      className='mt-8 rounded-lg border border-[#F0EEE9]/10 bg-[#012622] p-4'
    >
      <h3
        id='empty-cart-identity-title'
        className='font-google-sans text-lg font-extrabold text-[#F0EEE9]'
      >
        Velg innlogging
      </h3>
      <p className='mt-2 font-sans text-sm font-medium text-[#F0EEE9]/80'>
        Bekreft identiteten din med Vipps eller Klarna.
      </p>

      <div className='mt-4 space-y-3'>
        <VippsLoginButton />
        <KlarnaIdentityButton
          width='100%'
          onSignIn={() => setKlarnaStatus('klarna-connected')}
        />
      </div>

      <p
        aria-live='polite'
        className='mt-3 min-h-5 font-sans text-sm font-medium text-[#F0EEE9]'
      >
        {statusMessage(status)}
      </p>
      <p className='mt-2 font-sans text-xs font-medium text-[#F0EEE9]/70'>
        Identiteten bekreftes hos leverandøren, men kobles ikke
        til en Utekos-konto.
      </p>
    </section>
  )
}
