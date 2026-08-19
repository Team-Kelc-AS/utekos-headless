export function serializeWebVitalEntries(entries: unknown): unknown[] {
  if (!Array.isArray(entries)) {
    return []
  }

  try {
    const serialized: unknown = JSON.parse(JSON.stringify(entries))
    return Array.isArray(serialized) ? serialized : []
  } catch {
    return []
  }
}
