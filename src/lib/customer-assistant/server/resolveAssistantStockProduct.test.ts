import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  AssistantChatRequest,
  AssistantProduct
} from '../assistantProtocol'
import { resolveAssistantStockProduct } from './resolveAssistantStockProduct'

const products: AssistantProduct[] = [
  {
    availableForSale: false,
    handle: 'utekos-dun',
    href: '/produkter/utekos-dun',
    id: 'product-dun',
    image: null,
    price: { amount: '2999.00', currencyCode: 'NOK' },
    title: 'Utekos Dun',
    variants: []
  },
  {
    availableForSale: true,
    handle: 'utekos-techdown',
    href: '/produkter/utekos-techdown',
    id: 'product-techdown',
    image: null,
    price: { amount: '2499.00', currencyCode: 'NOK' },
    title: 'Utekos TechDown™',
    variants: []
  }
]

function messages(
  texts: string[]
): AssistantChatRequest['messages'] {
  return texts.flatMap((text, index) => [
    {
      id: `user-${index}`,
      role: 'user' as const,
      parts: [{ type: 'text' as const, text }]
    },
    ...(index < texts.length - 1 ?
      [
        {
          id: `assistant-${index}`,
          role: 'assistant' as const,
          parts: [
            {
              type: 'text' as const,
              text: 'Hvilket produkt gjelder det?'
            }
          ]
        }
      ]
    : [])
  ])
}

test('matches a product name without requiring page context', () => {
  assert.equal(
    resolveAssistantStockProduct({
      messages: messages([
        'Hjelp meg å sjekke lagerstatus.',
        'TechDown'
      ]),
      products
    })?.handle,
    'utekos-techdown'
  )
})

test('uses the newest unambiguous product choice', () => {
  assert.equal(
    resolveAssistantStockProduct({
      messages: messages([
        'Dun eller TechDown?',
        'Jeg mener Dun.'
      ]),
      products
    })?.handle,
    'utekos-dun'
  )
})

test('does not guess between multiple products', () => {
  assert.equal(
    resolveAssistantStockProduct({
      messages: messages(['Dun eller TechDown?']),
      products
    }),
    null
  )
})
