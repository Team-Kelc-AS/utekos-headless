export type MetaInsightsPixelStatWindow = {
  id: 'm15' | 'h1' | 'h1_web' | 'h1_server' | 'h24'
  aggregation: 'event_total_counts' | 'event'
  startTime: number
  endTime: number
  eventSource?: 'WEB_ONLY' | 'SERVER_ONLY'
}

export function buildMetaInsightsPixelStatWindows(now: Date) {
  const endTime = Math.floor(now.getTime() / 1000)
  const hour = endTime - 3600
  const windows: MetaInsightsPixelStatWindow[] = [
    {
      id: 'm15',
      aggregation: 'event_total_counts',
      startTime: endTime - 15 * 60,
      endTime
    },
    {
      id: 'h1',
      aggregation: 'event_total_counts',
      startTime: hour,
      endTime
    },
    {
      id: 'h1_web',
      aggregation: 'event',
      startTime: hour,
      endTime,
      eventSource: 'WEB_ONLY'
    },
    {
      id: 'h1_server',
      aggregation: 'event',
      startTime: hour,
      endTime,
      eventSource: 'SERVER_ONLY'
    },
    {
      id: 'h24',
      aggregation: 'event_total_counts',
      startTime: endTime - 86400,
      endTime
    }
  ]
  return windows
}
