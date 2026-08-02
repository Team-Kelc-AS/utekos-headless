import type { BrowserEventTrafficVerdict } from './classifyBrowserEventTraffic'

export type PageViewFunnelObservationIdentity = {
  edgeRequestId: string
  eventId: string
  observedAt: string
  pageViewId: string
}

export type PageViewFunnelObservationStore = {
  recordBrowserDispatch: (
    identity: PageViewFunnelObservationIdentity & {
      trafficClassification: BrowserEventTrafficVerdict['classification']
    }
  ) => Promise<boolean>
  recordCollectorReceipt: (
    identity: PageViewFunnelObservationIdentity
  ) => Promise<boolean>
}
