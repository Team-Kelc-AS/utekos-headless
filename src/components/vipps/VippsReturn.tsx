'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function VippsReturn() {
  const [message, setMessage] = useState(
    'Vi kontrollerer betalingen hos Vipps. Ikke start en ny betaling.'
  )
  const [complete, setComplete] = useState(false)
  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()
    // Current Vipps redirects carry the capability as query parameters. Retain
    // fragment support for a redirect already started by an earlier deployment.
    const queryParams = new URLSearchParams(
      window.location.search
    )
    const fragmentParams = new URLSearchParams(
      window.location.hash.slice(1)
    )
    const params =
      queryParams.has('reference') || queryParams.has('token') ?
        queryParams
      : fragmentParams
    const reference = params.get('reference'),
      token = params.get('token')
    let identity:
      | { reference: string; token: string }
      | undefined
    try {
      if (reference && token) {
        identity = { reference, token }
        sessionStorage.setItem(
          'utekos-vipps-return',
          JSON.stringify(identity)
        )
        history.replaceState(null, '', window.location.pathname)
      } else {
        const saved: unknown = JSON.parse(
          sessionStorage.getItem('utekos-vipps-return') ?? 'null'
        )
        if (
          saved &&
          typeof saved === 'object' &&
          'reference' in saved &&
          'token' in saved &&
          typeof saved.reference === 'string' &&
          typeof saved.token === 'string'
        )
          identity = {
            reference: saved.reference,
            token: saved.token
          }
      }
    } catch {
      if (reference && token) identity = { reference, token }
    }
    const started = Date.now()
    async function poll() {
      if (!identity) {
        setMessage(
          'Betalingsreferansen mangler. Kontakt oss før du eventuelt betaler på nytt.'
        )
        return
      }
      let delay = 3000
      try {
        const response = await fetch('/api/vipps/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(identity),
          signal: controller.signal
        })
        if (stopped) return
        const result: unknown = await response.json()
        if (
          result &&
          typeof result === 'object' &&
          'status' in result
        ) {
          if (result.status === 'paid') {
            setComplete(true)
            setMessage(
              'Takk for bestillingen! Betalingen er bekreftet, og ordren er registrert.'
            )
            return
          }
          if (result.status === 'terminal') {
            setMessage(
              'Vipps-betalingen ble avbrutt eller utløp. Du kan gå tilbake og starte et nytt kjøp.'
            )
            return
          }
        }
        if (!response.ok) delay = 5000
      } catch {
        delay = 5000
      }
      if (stopped) return
      if (Date.now() - started > 10 * 60 * 1000) {
        setMessage(
          'Vi har ikke kunnet bekrefte hele bestillingen ennå. Kontakt oss før du starter en ny betaling.'
        )
        return
      }
      timer = setTimeout(poll, delay)
    }
    timer = setTimeout(poll, identity ? 5000 : 0)
    return () => {
      stopped = true
      controller.abort()
      if (timer) clearTimeout(timer)
    }
  }, [])
  return (
    <main className='mx-auto max-w-xl space-y-6 px-6 py-24'>
      <h1 className='text-3xl font-extrabold'>
        {complete ? 'Takk for bestillingen' : 'Vipps-betaling'}
      </h1>
      <p role='status' aria-live='polite'>
        {message}
      </p>
      <p>
        <Link className='underline' href='/produkter'>
          Tilbake til produktene
        </Link>
      </p>
    </main>
  )
}
