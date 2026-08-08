const CLICK_ID_SESSION_KEY = 'utekos_click_ids'
const CLICK_ID_LOCAL_KEY = 'utekos_click_ids_v1'
const CLICK_ID_LOCAL_TTL_MS = 90 * 24 * 60 * 60 * 1000

export const CLICK_ID_PARAMETERS = [
  'dclid',
  'fbclid',
  'gbraid',
  'gclid',
  'msclkid',
  'snap_click_id',
  'ttclid',
  'twclid',
  'wbraid'
] as const

type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

type DurableClickIdRecord = {
  identifiers: Record<string, string>
  updatedAt: string
}

function readClickIdsFromSearchParams(
  searchParams: URLSearchParams
): Record<string, string> {
  const identifiers: Record<string, string> = {}

  for (const parameter of CLICK_ID_PARAMETERS) {
    const value = (
      parameter === 'snap_click_id' ?
        searchParams.get('ScCid')
      : searchParams.get(parameter)
    )?.trim()

    if (value) identifiers[parameter] = value
  }

  return identifiers
}

function sanitizeClickIds(
  parsed: unknown
): Record<string, string> {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {}
  }

  const identifiers: Record<string, string> = {}

  for (const parameter of CLICK_ID_PARAMETERS) {
    const value = (parsed as Record<string, unknown>)[parameter]
    if (typeof value === 'string' && value.trim()) {
      identifiers[parameter] = value.trim()
    }
  }

  return identifiers
}

function readPersistedClickIds(
  storage: StorageLike | undefined,
  key: string
): Record<string, string> {
  if (!storage) return {}

  try {
    const raw = storage.getItem(key)
    if (!raw) return {}

    return sanitizeClickIds(JSON.parse(raw))
  } catch {
    return {}
  }
}

function readDurableClickIds(
  storage: StorageLike | undefined,
  nowMs: number
): Record<string, string> {
  if (!storage) return {}

  try {
    const raw = storage.getItem(CLICK_ID_LOCAL_KEY)
    if (!raw) return {}

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    const record = parsed as Partial<DurableClickIdRecord>
    const updatedAtMs = Date.parse(String(record.updatedAt ?? ''))
    if (!Number.isFinite(updatedAtMs)) return {}
    if (nowMs - updatedAtMs > CLICK_ID_LOCAL_TTL_MS) return {}

    return sanitizeClickIds(record.identifiers)
  } catch {
    return {}
  }
}

function persistClickIds(
  storage: StorageLike | undefined,
  key: string,
  identifiers: Record<string, string>
) {
  if (!storage || Object.keys(identifiers).length === 0) return

  try {
    storage.setItem(key, JSON.stringify(identifiers))
  } catch {
    // Ignore quota / privacy-mode failures
  }
}

function persistDurableClickIds(
  storage: StorageLike | undefined,
  identifiers: Record<string, string>,
  nowMs: number
) {
  if (!storage || Object.keys(identifiers).length === 0) return

  try {
    const record: DurableClickIdRecord = {
      identifiers,
      updatedAt: new Date(nowMs).toISOString()
    }
    storage.setItem(CLICK_ID_LOCAL_KEY, JSON.stringify(record))
  } catch {
    // Ignore quota / privacy-mode failures
  }
}

function getDefaultSessionStorage(): StorageLike | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    return window.sessionStorage
  } catch {
    return undefined
  }
}

function getDefaultLocalStorage(): StorageLike | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

/**
 * URL click IDs win over session/local values for the same key.
 * Newly seen URL values are merged into sessionStorage and a 90-day
 * localStorage record so paid-media click IDs survive tab close.
 */
export function resolveClickIds(
  pageUrl: string,
  sessionStorageLike: StorageLike | undefined = getDefaultSessionStorage(),
  localStorageLike: StorageLike | undefined = getDefaultLocalStorage(),
  nowMs: number = Date.now()
): Record<string, string> | undefined {
  const fromUrl = readClickIdsFromSearchParams(
    new URL(pageUrl).searchParams
  )
  const fromSession = readPersistedClickIds(
    sessionStorageLike,
    CLICK_ID_SESSION_KEY
  )
  const fromLocal = readDurableClickIds(localStorageLike, nowMs)
  const merged = {
    ...fromLocal,
    ...fromSession,
    ...fromUrl
  }

  if (Object.keys(fromUrl).length > 0 || Object.keys(merged).length > 0) {
    if (Object.keys(fromUrl).length > 0) {
      persistClickIds(sessionStorageLike, CLICK_ID_SESSION_KEY, merged)
      persistDurableClickIds(localStorageLike, merged, nowMs)
    } else if (Object.keys(fromSession).length === 0 && Object.keys(fromLocal).length > 0) {
      // Hydrate the current tab from durable storage without extending TTL.
      persistClickIds(sessionStorageLike, CLICK_ID_SESSION_KEY, merged)
    }
  }

  return Object.keys(merged).length > 0 ? merged : undefined
}

export { CLICK_ID_LOCAL_KEY, CLICK_ID_SESSION_KEY }
