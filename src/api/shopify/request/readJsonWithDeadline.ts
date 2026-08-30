import type { ShopifyRequestDeadline } from './createShopifyRequestDeadline'

export async function readJsonWithDeadline(
  response: Response,
  deadline: ShopifyRequestDeadline
): Promise<unknown> {
  if (!response.body) {
    return deadline.race(response.json())
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = ''

  try {
    while (true) {
      const result = await deadline.race(reader.read())

      if (result.done) {
        break
      }

      text += decoder.decode(result.value, { stream: true })
    }

    text += decoder.decode()
    return JSON.parse(text) as unknown
  } catch (error) {
    // Cancellation is best-effort transport cleanup. Some fetch implementations
    // do not settle `cancel()` until the remote body closes, so awaiting it here
    // would let cleanup outlive (and effectively defeat) the request deadline.
    try {
      void reader.cancel(error).catch(() => undefined)
    } catch {
      // Preserve the original deadline or parse error if a nonstandard reader
      // throws synchronously while cancellation is initiated.
    }
    throw error
  }
}
