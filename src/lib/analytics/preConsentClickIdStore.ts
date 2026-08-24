export const PRE_CONSENT_CLICK_ID_GLOBAL_KEY =
  '__utekosPreConsentClickIdsV1'

export const PRE_CONSENT_CLICK_ID_KEYS = [
  'fbclid',
  'msclkid',
  'epik',
  'sc_click_id'
] as const

export type PreConsentClickIdKey =
  (typeof PRE_CONSENT_CLICK_ID_KEYS)[number]

export type PreConsentClickIdDecision =
  | 'pending'
  | 'granted'
  | 'denied'

export type PreConsentClickIdSnapshot = {
  clickIds: Partial<Record<PreConsentClickIdKey, string>>
  observedAtMs: Partial<Record<PreConsentClickIdKey, number>>
  decision: PreConsentClickIdDecision
}

const QUERY_TO_CANONICAL_KEY = [
  ['fbclid', 'fbclid'],
  ['msclkid', 'msclkid'],
  ['epik', 'epik'],
  ['ScCid', 'sc_click_id']
] as const

const PRE_CONSENT_REDACTED_QUERY_KEYS = [
  'fbclid',
  'msclkid',
  'epik',
  'ScCid',
  'sc_click_id'
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value && typeof value === 'object' && !Array.isArray(value)
  )
}

function readScopeValue(scope: unknown) {
  if (!isRecord(scope)) return undefined
  return scope[PRE_CONSENT_CLICK_ID_GLOBAL_KEY]
}

function parseDecision(value: unknown): PreConsentClickIdDecision {
  return value === 'granted' || value === 'denied' ? value : 'pending'
}

function ensureRawState(scope: Record<string, unknown>) {
  const existing = scope[PRE_CONSENT_CLICK_ID_GLOBAL_KEY]
  const state = isRecord(existing) ? existing : {}

  if (!isRecord(state.clickIds)) state.clickIds = {}
  if (!isRecord(state.observedAtMs)) state.observedAtMs = {}
  state.decision = parseDecision(state.decision)
  scope[PRE_CONSENT_CLICK_ID_GLOBAL_KEY] = state

  return state
}

export function readPreConsentClickIdSnapshot(
  scope: unknown = globalThis
): PreConsentClickIdSnapshot | undefined {
  const raw = readScopeValue(scope)
  if (!isRecord(raw)) return undefined

  const rawClickIds = isRecord(raw.clickIds) ? raw.clickIds : {}
  const rawObservedAt =
    isRecord(raw.observedAtMs) ? raw.observedAtMs : {}
  const clickIds: Partial<Record<PreConsentClickIdKey, string>> = {}
  const observedAtMs: Partial<Record<PreConsentClickIdKey, number>> = {}

  for (const key of PRE_CONSENT_CLICK_ID_KEYS) {
    const value = rawClickIds[key]
    if (typeof value === 'string' && value.trim()) {
      // Provider click identifiers are opaque and case-sensitive. Keep the
      // decoded URLSearchParams value exactly as observed.
      clickIds[key] = value
    }

    const observedAt = rawObservedAt[key]
    if (
      typeof observedAt === 'number' &&
      Number.isFinite(observedAt) &&
      observedAt > 0
    ) {
      observedAtMs[key] = observedAt
    }
  }

  return {
    clickIds,
    observedAtMs,
    decision: parseDecision(raw.decision)
  }
}

export function readPreConsentClickIds(
  scope: unknown = globalThis
): Record<string, string> {
  return {
    ...(readPreConsentClickIdSnapshot(scope)?.clickIds ?? {})
  }
}

export function setPreConsentClickIdDecision(
  decision: PreConsentClickIdDecision,
  scope: unknown = globalThis
): void {
  if (!isRecord(scope)) return
  const state = ensureRawState(scope)
  state.decision = decision
}

export function capturePreConsentClickIdsFromUrl(
  pageUrl: string,
  scope: unknown = globalThis,
  nowMs: number = Date.now()
): void {
  if (!isRecord(scope)) return

  const state = ensureRawState(scope)
  if (state.decision === 'denied') return

  let searchParams: URLSearchParams

  try {
    searchParams = new URL(pageUrl).searchParams
  } catch {
    return
  }

  const clickIds = state.clickIds as Record<string, unknown>
  const observedAtMs = state.observedAtMs as Record<string, unknown>

  for (const [queryKey, canonicalKey] of QUERY_TO_CANONICAL_KEY) {
    const value = searchParams.get(queryKey)
    if (typeof value !== 'string' || !value.trim()) continue

    clickIds[canonicalKey] = value
    observedAtMs[canonicalKey] = nowMs
  }
}

export function redactMarketingClickIdsFromUrl(pageUrl: string): string {
  let url: URL

  try {
    url = new URL(pageUrl)
  } catch {
    return pageUrl
  }

  let changed = false

  for (const key of PRE_CONSENT_REDACTED_QUERY_KEYS) {
    if (!url.searchParams.has(key)) continue
    url.searchParams.delete(key)
    changed = true
  }

  return changed ? url.href : pageUrl
}

export function clearPreConsentClickIds(
  scope: unknown = globalThis
): void {
  if (!isRecord(scope)) return

  scope[PRE_CONSENT_CLICK_ID_GLOBAL_KEY] = {
    clickIds: {},
    observedAtMs: {},
    decision: 'denied'
  }
}
