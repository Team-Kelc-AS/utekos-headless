import 'server-only'

import Script from 'next/script'
import { resolveTrackingAuthorization } from '@/lib/consent/resolveTrackingAuthorization'
import { GOOGLE_TAG_MANAGER_BOOTSTRAP } from './googleTagManagerBootstrap'
import { STAPE_CUSTOM_LOADER } from './stapeCustomLoader'

type GoogleTagManagerLoaderProps = {
  enabled: boolean
}

/**
 * Loads GTM only when marketing consent is granted, and only after the page
 * is interactive. Cookie Keeper must start before the first Pixel dispatch
 * finishes its bounded cookie-restoration wait.
 */
export function GoogleTagManagerLoader({
  enabled
}: GoogleTagManagerLoaderProps) {
  if (!enabled) {
    return null
  }

  if (resolveTrackingAuthorization().marketing !== 'granted') {
    return null
  }

  return (
    <>
      <Script
        id='_next-gtm-consent-defaults'
        strategy='afterInteractive'
        dangerouslySetInnerHTML={{
          __html: GOOGLE_TAG_MANAGER_BOOTSTRAP
        }}
      />

      <Script
        id='_next-stape-custom-loader'
        strategy='afterInteractive'
        dangerouslySetInnerHTML={{ __html: STAPE_CUSTOM_LOADER }}
      />
    </>
  )
}
