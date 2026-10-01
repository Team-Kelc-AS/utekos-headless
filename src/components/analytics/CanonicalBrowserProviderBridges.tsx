import { MetaBrowserTransportLoader } from './MetaBrowserTransportLoader'

type CanonicalBrowserProviderBridgesProps = {
  enabled: boolean
  deferUntilIdle?: boolean
}

export function CanonicalBrowserProviderBridges({
  enabled,
  deferUntilIdle = false
}: CanonicalBrowserProviderBridgesProps) {
  if (!enabled) return null

  return (
    <MetaBrowserTransportLoader
      deferUntilIdle={deferUntilIdle}
    />
  )
}
