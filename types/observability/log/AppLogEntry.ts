export type AppLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

export type AppLogAdPlatform =
  | 'google'
  | 'meta'
  | 'microsoft_uet'
  | 'pinterest'

export type AppLogJsonValue =
  | string
  | number
  | boolean
  | null
  | AppLogJsonValue[]
  | { readonly [key: string]: AppLogJsonValue }

export type AppLogConsentSnapshot = {
  analytics: 'denied' | 'granted'
  marketing: 'denied' | 'granted'
  preferences: 'denied' | 'granted'
  source: 'cookiebot'
  version: string
}

export type AppLogTrackingEnvironment =
  | 'development'
  | 'preview'
  | 'production'
  | 'test'

export type AppLogDeviceInfo = {
  language?: string
  pixelRatio?: number
  platform?: string
  screenHeight?: number
  screenWidth?: number
  viewportHeight?: number
  viewportWidth?: number
}

export type AppLogAdPlatformEvent = {
  eventName: string
  requiredParameters: readonly string[]
  transport: {
    browser: string | null
    server: string | null
  }
  parameters: Record<string, AppLogJsonValue>
}

export type AppLogAdPlatformEvents = Partial<
  Record<AppLogAdPlatform, AppLogAdPlatformEvent>
>

export type AppLogEntryExtras = {
  adPlatformEvents?: AppLogAdPlatformEvents
  consent?: AppLogConsentSnapshot
  environment?: AppLogTrackingEnvironment
  eventDeviceInfo?: AppLogDeviceInfo
  eventId?: string
  eventName?: string
  eventTime?: string
  pageTitle?: string
  pageUrl?: string
  pageViewId?: string
  referrerUrl?: string
  webVitalMetricDelta?: number
  webVitalMetricEntries?: AppLogJsonValue[]
  webVitalMetricId?: string
  webVitalMetricName?: string
  webVitalMetricNavigationType?: string
  webVitalMetricRating?: string
  webVitalMetricValue?: number
}

export type AppLogEntry = {
  event: string
  id: string
  timestamp: string
  level: AppLogLevel
  data: Record<string, unknown>
  context: Record<string, unknown>
} & AppLogEntryExtras
