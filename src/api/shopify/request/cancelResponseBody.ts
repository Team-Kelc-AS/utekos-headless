export function cancelResponseBody(
  response: Response | undefined
): void {
  const body = response?.body

  if (!body || body.locked) {
    return
  }

  setTimeout(() => {
    try {
      void body.cancel().catch(() => undefined)
    } catch {
      // Best-effort cleanup must not replace the original request failure.
    }
  }, 0)
}
