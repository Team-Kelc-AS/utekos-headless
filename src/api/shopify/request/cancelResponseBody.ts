export function cancelResponseBody(
  response: Response | undefined
): void {
  const body = response?.body

  if (!body || body.locked) {
    return
  }

  void body.cancel().catch(() => undefined)
}
