'use client'

import { track } from '@vercel/analytics'
import type { FacebookLoginTrafficSignal } from './facebookLoginTraffic'

export type FacebookLoginFunnelStage =
  | 'prompt_view'
  | 'sdk_ready'
  | 'button_rendered'
  | 'login_completed'
  | 'contact_required'
  | 'contact_submitted'
  | 'dismissed'
  | 'login_error'
  | 'disconnect_completed'

type DataLayerWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>
}

export function trackFacebookLoginFunnel(input: {
  stage: FacebookLoginFunnelStage
  surface: 'prompt' | 'privacy'
  trafficSignal?:
    | FacebookLoginTrafficSignal
    | 'preview'
    | undefined
}) {
  if (typeof window === 'undefined') return

  const data = {
    stage: input.stage,
    surface: input.surface,
    ...(input.trafficSignal ?
      { traffic_signal: input.trafficSignal }
    : {})
  }
  const dataLayerWindow = window as unknown as DataLayerWindow
  dataLayerWindow.dataLayer = dataLayerWindow.dataLayer ?? []
  dataLayerWindow.dataLayer.push({
    event: 'facebook_login_funnel',
    ...data
  })

  try {
    track('Facebook Login Funnel', data)
  } catch {}
}
