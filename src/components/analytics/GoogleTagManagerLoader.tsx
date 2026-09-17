import 'server-only'

import Script from 'next/script'
import { GOOGLE_TAG_MANAGER_BOOTSTRAP } from './googleTagManagerBootstrap'
import { STAPE_CUSTOM_LOADER } from './stapeCustomLoader'

type GoogleTagManagerLoaderProps = {
  enabled: boolean
}

export function GoogleTagManagerLoader({
  enabled
}: GoogleTagManagerLoaderProps) {
  if (!enabled) {
    return null
  }

  return (
    <>
      <Script
        id='_next-gtm-consent-defaults'
        strategy='beforeInteractive'
        dangerouslySetInnerHTML={{
          __html:
            GOOGLE_TAG_MANAGER_BOOTSTRAP
        }}
      />

      <Script
        id='_next-stape-custom-loader'
        strategy='beforeInteractive'
        dangerouslySetInnerHTML={{
          __html: STAPE_CUSTOM_LOADER
        }}
      />
    </>
  )
}
