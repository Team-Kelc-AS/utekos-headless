import type {
  AssistantChatRequest,
  AssistantProduct
} from '../assistantProtocol'
import { normalizeAssistantText } from '../assistantProductProfiles'

function escapeRegularExpression(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeProductName(value: string) {
  return normalizeAssistantText(value)
    .replace(/[™®]/gu, '')
    .replace(/-/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
}

function productAliases(product: AssistantProduct) {
  const handle = normalizeProductName(product.handle)
  const title = normalizeProductName(product.title)
  const shortHandle = handle.replace(/^utekos\s+/u, '')
  const shortTitle = title.replace(/^utekos\s+/u, '')

  return [
    ...new Set([handle, title, shortHandle, shortTitle])
  ].filter(alias => alias.length >= 3)
}

function includesAlias(text: string, alias: string) {
  const pattern = escapeRegularExpression(alias).replace(
    /\s+/gu,
    '\\s+'
  )

  return new RegExp(
    `(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`,
    'u'
  ).test(text)
}

export function resolveAssistantStockProduct({
  messages,
  products
}: {
  messages: AssistantChatRequest['messages']
  products: readonly AssistantProduct[]
}): AssistantProduct | null {
  const userTexts = messages
    .filter(message => message.role === 'user')
    .map(message =>
      normalizeProductName(
        message.parts.map(part => part.text).join(' ')
      )
    )
    .toReversed()

  for (const text of userTexts) {
    const matches = products.filter(product =>
      productAliases(product).some(alias =>
        includesAlias(text, alias)
      )
    )

    if (matches.length === 1) return matches[0] ?? null
    if (matches.length > 1) return null
  }

  return null
}
