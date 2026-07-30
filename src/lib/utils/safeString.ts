// Path: src/lib/utils/safeString.ts
export function safeString(val: unknown): string | undefined {
  if (!val) return undefined
  const s = String(val).trim()
  return s.length > 0 ? s : undefined
}
