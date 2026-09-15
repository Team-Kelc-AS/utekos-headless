'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { LandingPurchaseFallback } from './LandingPurchaseFallback'
import { getLandingPurchaseData } from './getLandingPurchaseData'

const Purchase = dynamic(
  () => import('./LandingPurchaseRuntime'),
  { ssr: false, loading: LandingPurchaseFallback }
)

export function DeferredPurchaseClientLanding(props: {
  initialVariantId: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [data, setData] = useState<Awaited<
    ReturnType<typeof getLandingPurchaseData>
  > | null>(null)
  const [failed, setFailed] = useState(false)
  const [cartRequest, setCartRequest] = useState(0)
  useEffect(() => {
    const load = () => setReady(true)
    const openCart = () => {
      load()
      setCartRequest(value => value + 1)
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          load()
          observer.disconnect()
        }
      },
      { rootMargin: '800px' }
    )
    if (ref.current) observer.observe(ref.current)
    window.addEventListener('utekos:landing:purchase', load)
    window.addEventListener('utekos:landing:cart', openCart)
    if (location.hash === '#landing-size-selection') load()
    return () => {
      observer.disconnect()
      window.removeEventListener('utekos:landing:cart', openCart)
      window.removeEventListener('utekos:landing:purchase', load)
    }
  }, [])
  useEffect(() => {
    if (!ready) return
    let active = true
    void getLandingPurchaseData(props.initialVariantId)
      .then(value => {
        if (active) setData(value)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [ready, props.initialVariantId])
  return (
    <div ref={ref}>
      {data ?
        <Purchase {...data} cartRequest={cartRequest} />
      : <div
          id='landing-size-selection'
          className='landing-purchase-placeholder'
        >
          <LandingPurchaseFallback />
          {failed && (
            <p role='alert'>
              Kunne ikke hente kjøpsvalgene. Åpne produktsiden
              via lenken over.
            </p>
          )}
        </div>
      }
    </div>
  )
}
