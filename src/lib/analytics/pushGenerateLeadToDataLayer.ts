import { enrichBrowserMetaAudience } from './browserMetaAudience'
import type { GenerateLeadDataLayerEvent } from './generateLeadEvent'

type DataLayerWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>
}

export function pushGenerateLeadToDataLayer(
  event: GenerateLeadDataLayerEvent
): void {
  const dataLayerWindow = window as unknown as DataLayerWindow
  dataLayerWindow.dataLayer = dataLayerWindow.dataLayer ?? []
  const canonical = enrichBrowserMetaAudience(event.canonical_event)
  dataLayerWindow.dataLayer.push({
    event: event.event,
    event_id: event.event_id,
    event_time: event.event_time,
    source: event.source,
    ...(event.page_view_id ?
      { page_view_id: event.page_view_id }
    : {}),
    custom_data: event.custom_data,
    canonical_event: canonical,
    meta_audience: canonical.meta_audience ?? null
  })
}
