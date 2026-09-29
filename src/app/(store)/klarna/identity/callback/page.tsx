'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { loadKlarnaPublicConfig } from '@/components/klarna/utils/loadKlarnaPublicConfig'
import { loadKlarnaIdentitySdk } from '@/components/klarna/utils/loadKlarnaIdentitySdk'

export default function KlarnaIdentityCallbackPage() {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true

    void loadKlarnaPublicConfig()
      .then(config =>
        loadKlarnaIdentitySdk({ clientId: config.client_id })
      )
      .then(klarna => {
        if (!active) return

        klarna.Identity.on('signin', async () => {
          if (!active) return
          if (window.opener) {
            window.close()
            return
          }
          window.location.replace('/')
        })
        klarna.Identity.on('error', async () => {
          if (active) setFailed(true)
        })
      })
      .catch(() => {
        if (active) setFailed(true)
      })

    return () => {
      active = false
    }
  }, [])

  return (
    <main className='flex min-h-dvh items-center justify-center bg-background px-6 text-center text-foreground'>
      <div role='status' className='max-w-sm'>
        {failed ?
          <>
            <h1 className='font-google-sans font-extrabold text-2xl'>
              Klarna-innloggingen kunne ikke fullføres
            </h1>
            <Link
              href='/'
              className='mt-6 inline-flex min-h-11 items-center underline underline-offset-4'
            >
              Gå tilbake til Utekos
            </Link>
          </>
        : <>
            <Loader2
              aria-hidden='true'
              className='mx-auto size-6 animate-spin'
            />
            <h1 className='mt-4 font-google-sans font-extrabold text-2xl'>
              Fullfører med Klarna
            </h1>
          </>}
      </div>
    </main>
  )
}
