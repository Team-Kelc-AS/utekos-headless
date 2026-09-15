'use client'

import { useEffect } from 'react'
import { sendGAEvent } from '@next/third-parties/google'
export function GoogleAdsConversion() {
  useEffect(() => {
    sendGAEvent('event', 'conversion', {
      send_to: 'AW-17819485818/OGgpCLfd09QbEPqM_7BC',
      value: 1.0,
      currency: 'NOK'
    })
  }, [])

  return null
}
