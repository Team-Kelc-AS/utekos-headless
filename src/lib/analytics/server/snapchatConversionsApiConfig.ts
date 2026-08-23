export type SnapchatConversionsApiConfig = {
  accessToken: string
  cutoverAtMs: number
  enabled: boolean
  pixelId: string
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(
      `Snapchat Conversions API is enabled but ${name} is missing`
    )
  }
  return value
}

function resolveMatchingPixelIds() {
  const serverPixelId = process.env.SNAPCHAT_PIXEL_ID?.trim()
  const browserPixelId =
    process.env.NEXT_PUBLIC_SNAPCHAT_PIXEL_ID?.trim()

  return Boolean(
    serverPixelId &&
    browserPixelId &&
    serverPixelId === browserPixelId
  )
}

export function isSnapchatConversionsApiConfigured() {
  return (
    isSnapchatConversionsApiEnabled() &&
    Boolean(
      process.env.SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN?.trim()
    ) &&
    resolveSnapchatCutoverAtMs() !== undefined &&
    resolveMatchingPixelIds()
  )
}

export function isSnapchatConversionsApiEnabled() {
  return process.env.SNAPCHAT_CONVERSIONS_API_ENABLED === 'true'
}

export function getSnapchatConversionsApiConfig(): SnapchatConversionsApiConfig {
  const enabled = isSnapchatConversionsApiEnabled()

  if (!enabled) {
    return {
      accessToken: '',
      cutoverAtMs: 0,
      enabled: false,
      pixelId: ''
    }
  }

  const pixelId = requiredEnv('SNAPCHAT_PIXEL_ID')
  const publicPixelId = requiredEnv(
    'NEXT_PUBLIC_SNAPCHAT_PIXEL_ID'
  )
  if (pixelId !== publicPixelId) {
    throw new Error(
      'Snapchat Conversions API is enabled but browser and server Pixel IDs differ'
    )
  }
  const cutoverAtMs = resolveSnapchatCutoverAtMs()
  if (cutoverAtMs === undefined) {
    throw new Error(
      'Snapchat Conversions API is enabled but SNAPCHAT_CONVERSIONS_API_CUTOVER_AT is missing or invalid'
    )
  }

  return {
    accessToken: requiredEnv(
      'SNAPCHAT_CONVERSIONS_API_ACCESS_TOKEN'
    ),
    cutoverAtMs,
    enabled: true,
    pixelId
  }
}

export function resolveSnapchatCutoverAtMs() {
  const value =
    process.env.SNAPCHAT_CONVERSIONS_API_CUTOVER_AT?.trim()
  if (!value) return undefined

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : undefined
}
