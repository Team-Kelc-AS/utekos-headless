import 'server-only'

import Script from 'next/script'
import { SITE_URL } from '@/constants'

const GOOGLE_TAG_MANAGER_ID =
  'GTM-5TWMJQFP'

const googleTagGatewayOrigin =
  (
    process.env.VERCEL_ENV === 'preview' &&
    process.env.VERCEL_URL
  ) ?
    `https://${process.env.VERCEL_URL}`
  : process.env.NODE_ENV ===
      'development' ?
    'http://localhost:3000'
  : SITE_URL

const googleTagManagerScriptUrl =
  new URL(
    '/__gtg/gtm.js',
    googleTagGatewayOrigin
  )

googleTagManagerScriptUrl.searchParams.set(
  'id',
  GOOGLE_TAG_MANAGER_ID
)

const GOOGLE_TAG_MANAGER_BOOTSTRAP = `
  (function(w,l){
    w[l]=w[l]||[];
    w[l].push({
      'gtm.start':
        new Date().getTime(),
      event:'gtm.js'
    });
  })(window,'dataLayer');
`

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
        id='_next-gtm-init'
        strategy='beforeInteractive'
        dangerouslySetInnerHTML={{
          __html:
            GOOGLE_TAG_MANAGER_BOOTSTRAP
        }}
      />

      <Script
        id='_next-gtm'
        data-ntpc='GTM'
        src={
          googleTagManagerScriptUrl.toString()
        }
        strategy='beforeInteractive'
      />
    </>
  )
}