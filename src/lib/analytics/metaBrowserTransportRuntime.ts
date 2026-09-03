type MetaPixelState = {
  initialized: boolean
  lastDataLayerIndex: number
  listening: boolean
  poller: number | null
  sent: Record<string, boolean>
  timer: number | null
}

export type MetaBrowserWindow = Window & {
  __utekosMetaPixelState?: MetaPixelState
  dataLayer?: unknown[]
}

export function discardRejectedMetaBrowserEvents(
  browserWindow: MetaBrowserWindow
): void {
  const dataLayerLength = browserWindow.dataLayer?.length ?? 0
  const currentState = browserWindow.__utekosMetaPixelState

  if (currentState) {
    currentState.lastDataLayerIndex = dataLayerLength
    return
  }

  browserWindow.__utekosMetaPixelState = {
    initialized: false,
    lastDataLayerIndex: dataLayerLength,
    listening: false,
    poller: null,
    sent: {},
    timer: null
  }
}
