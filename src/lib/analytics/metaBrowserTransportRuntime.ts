type MetaPixelState = {
  canonicalEventListening: boolean
  dispatches: Record<
    string,
    {
      eventId: string
      eventName: string
      scriptStatus: string
    }
  >
  initialized: boolean
  lastDataLayerIndex: number
  listening: boolean
  poller: number | null
  sent: Record<string, boolean>
  scriptStatus: string
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
    canonicalEventListening: false,
    dispatches: {},
    initialized: false,
    lastDataLayerIndex: dataLayerLength,
    listening: false,
    poller: null,
    sent: {},
    scriptStatus: 'idle',
    timer: null
  }
}
