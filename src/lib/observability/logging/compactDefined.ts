export function compactDefined<T extends Record<string, unknown>>(
  value: T
): { [K in keyof T]?: Exclude<T[K], undefined> } {
  const compacted: Record<string, unknown> = {}

  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) compacted[key] = entry
  }

  return compacted as { [K in keyof T]?: Exclude<T[K], undefined> }
}
