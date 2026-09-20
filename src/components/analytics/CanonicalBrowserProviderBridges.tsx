import { MetaBrowserTransportLoader } from './MetaBrowserTransportLoader'
import { CanonicalBrowserProviderScript } from './CanonicalBrowserProviderScript'

type CanonicalBrowserProviderBridgesProps = {
  enabled: boolean
  pinterestTagId?: string | undefined
  snapchatPixelEnabled: boolean
  snapchatPixelId?: string | undefined
}

export function CanonicalBrowserProviderBridges({
  enabled,
  pinterestTagId,
  snapchatPixelEnabled,
  snapchatPixelId
}: CanonicalBrowserProviderBridgesProps) {
  if (!enabled) return null

  return (
    <>
      <MetaBrowserTransportLoader />
      {pinterestTagId ?
        <CanonicalBrowserProviderScript
          id='pinterest-tag-canonical-browser'
          src='/analytics/pinterest-tag-canonical-v1.js'
          data-tag-id={pinterestTagId}
        />
      : null}
      {snapchatPixelEnabled && snapchatPixelId ?
        <CanonicalBrowserProviderScript
          id='snapchat-pixel-canonical-browser'
          src='/analytics/snapchat-pixel-canonical-v1.js'
          data-pixel-id={snapchatPixelId}
        />
      : null}
    </>
  )
}
