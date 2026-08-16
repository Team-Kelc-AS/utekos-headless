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
    await reader.cancel().catch(() => undefined)
    throw error
  }
}
