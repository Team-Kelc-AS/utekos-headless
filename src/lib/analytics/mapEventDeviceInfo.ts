export type EventDeviceInfoInput = {
  language?: string
  pixelRatio?: number
  platform?: string
  screenHeight?: number
  screenWidth?: number
  userAgent?: string
  viewportHeight?: number
  viewportWidth?: number
}

function isPositiveFiniteNumber(
  value: number | undefined
): value is number {
  return (
    value !== undefined &&
    Number.isFinite(value) &&
    value > 0
  )
}

function isPositiveInteger(
  value: number | undefined
): value is number {
  return isPositiveFiniteNumber(value) && Number.isInteger(value)
}

export function mapEventDeviceInfo(input: EventDeviceInfoInput | undefined) {
  if (!input) return undefined

  const deviceInfo = {
    ...(input.language ? { language: input.language } : {}),
    ...(!isPositiveFiniteNumber(input.pixelRatio) ?
      {}
    : { pixel_ratio: input.pixelRatio }),
    ...(input.platform ? { platform: input.platform } : {}),
    ...(!isPositiveInteger(input.screenHeight) ?
      {}
    : { screen_height: input.screenHeight }),
    ...(!isPositiveInteger(input.screenWidth) ?
      {}
    : { screen_width: input.screenWidth }),
    ...(input.userAgent ? { user_agent: input.userAgent } : {}),
    ...(!isPositiveInteger(input.viewportHeight) ?
      {}
    : { viewport_height: input.viewportHeight }),
    ...(!isPositiveInteger(input.viewportWidth) ?
      {}
    : { viewport_width: input.viewportWidth })
  }

  return Object.keys(deviceInfo).length > 0 ? deviceInfo : undefined
}
