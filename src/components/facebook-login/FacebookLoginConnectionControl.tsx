'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { trackFacebookLoginFunnel } from '@/lib/facebook-login/trackFacebookLoginFunnel'

const statusResponseSchema = z.strictObject({
  connected: z.boolean().optional(),
  linked: z.boolean().optional(),
  needs_contact: z.boolean().optional()
})

type ConnectionState =
  | 'loading'
  | 'linked'
  | 'disconnected'
  | 'error'

export function FacebookLoginConnectionControl() {
  const [state, setState] = useState<ConnectionState>('loading')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let disposed = false

    void fetch('/api/identity/facebook/status', {
      cache: 'no-store',
      credentials: 'same-origin'
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error('facebook_login_status_failed')
        }
        return statusResponseSchema.parse(await response.json())
      })
      .then(status => {
        if (!disposed) {
          setState(status.linked ? 'linked' : 'disconnected')
        }
      })
      .catch(() => {
        if (!disposed) setState('error')
      })

    return () => {
      disposed = true
    }
  }, [])

  const disconnect = async () => {
    if (pending) return
    setPending(true)

    try {
      const response = await fetch(
        '/api/identity/facebook/disconnect',
        {
          method: 'POST',
          cache: 'no-store',
          credentials: 'same-origin'
        }
      )
      if (!response.ok) {
        throw new Error('facebook_login_disconnect_failed')
      }

      trackFacebookLoginFunnel({
        stage: 'disconnect_completed',
        surface: 'privacy'
      })
      setState('disconnected')
    } catch {
      setState('error')
    } finally {
      setPending(false)
    }
  }

  return (
    <section
      id='facebook-tilkobling'
      className='mt-12 rounded-2xl border border-white/15 p-6'
      aria-labelledby='facebook-tilkobling-title'
    >
      <h2
        id='facebook-tilkobling-title'
        className='font-utekos-text-medium text-2xl'
      >
        Facebook-tilkobling
      </h2>
      <div aria-live='polite' className='mt-3 text-white/80'>
        {state === 'loading' ?
          <p>Kontrollerer tilkoblingen …</p>
        : state === 'linked' ?
          <>
            <p>
              Denne nettleseren er koblet til Facebook Login hos
              Utekos.
            </p>
            <Button
              type='button'
              variant='outline'
              disabled={pending}
              onClick={disconnect}
              className='mt-4'
            >
              {pending ? 'Kobler fra …' : 'Koble fra Facebook'}
            </Button>
          </>
        : state === 'error' ?
          <p>
            Tilkoblingen kunne ikke endres akkurat nå. Prøv igjen
            senere.
          </p>
        : <p>
            Ingen aktiv Facebook-tilkobling er lagret i denne
            nettleseren.
          </p>
        }
      </div>
    </section>
  )
}
