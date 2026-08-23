const SNAPCHAT_MAX_EVENT_AGE_MS = 7 * 24 * 60 * 60 * 1000

export type SnapchatEventFreshness = 'within_7d' | 'outside_7d'

export function classifySnapchatEventFreshness(
  eventTime: string,
  nowMs: number = Date.now()
): SnapchatEventFreshness {
  const eventTimeMs = Date.parse(eventTime)
  if (!Number.isFinite(eventTimeMs)) return 'outside_7d'

  return nowMs - eventTimeMs > SNAPCHAT_MAX_EVENT_AGE_MS ?
      'outside_7d'
    : 'within_7d'
}

export { SNAPCHAT_MAX_EVENT_AGE_MS }
