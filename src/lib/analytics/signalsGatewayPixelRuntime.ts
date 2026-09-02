type SignalsGatewayCommandQueue = {
  (...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  loaded: boolean
  push: SignalsGatewayCommandQueue
  queue: unknown[][]
  version: '2.0'
}

type MetaPixelState = {
  initialized: boolean
  lastDataLayerIndex: number
  listening: boolean
  poller: number | null
  sent: Record<string, boolean>
  timer: number | null
}

type SignalsGatewayPixelState = {
  host: string
  initialized: boolean
  mode: 'automatic_fbq_fork'
  pixelId: string
}

export type MetaBrowserWindow = Window & {
  _cbq?: SignalsGatewayCommandQueue
  __utekosMetaPixelState?: MetaPixelState
  __utekosSignalsGatewayPixelState?: SignalsGatewayPixelState
  cbq?: SignalsGatewayCommandQueue
  dataLayer?: unknown[]
}

export function prepareSignalsGatewayPixelQueue(
  browserWindow: MetaBrowserWindow
): void {
  if (browserWindow.cbq) return

  const queue = function(...args: unknown[]) {
    if (queue.callMethod) {
      queue.callMethod(...args)
      return
    }

    queue.queue.push(args)
  } as SignalsGatewayCommandQueue

  queue.push = queue
  queue.loaded = true
  queue.version = '2.0'
  queue.queue = []

  browserWindow.cbq = queue
  browserWindow._cbq ??= queue
}

export function initializeSignalsGatewayPixel(
  browserWindow: MetaBrowserWindow,
  config: { host: string; pixelId: string }
): void {
  const currentState =
    browserWindow.__utekosSignalsGatewayPixelState

  if (currentState?.initialized) {
    if (
      currentState.host !== config.host ||
      currentState.pixelId !== config.pixelId
    ) {
      throw new Error(
        'Signals Gateway Pixel is already initialized with a different configuration'
      )
    }

    return
  }

  if (!browserWindow.cbq) {
    throw new Error('Signals Gateway Pixel queue is unavailable')
  }

  browserWindow.cbq('setHost', config.host)
  browserWindow.cbq('init', config.pixelId)
  browserWindow.__utekosSignalsGatewayPixelState = {
    host: config.host,
    initialized: true,
    mode: 'automatic_fbq_fork',
    pixelId: config.pixelId
  }
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
