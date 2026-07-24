import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assistantSourceSchema,
  getLastUserText,
  parseAssistantChatRequest,
  projectTextOnlyMessages,
  type AssistantUIMessage
} from './assistantProtocol'

const request = {
  id: 'assistant-chat',
  sessionId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
  intent: 'product_help',
  messages: [
    {
      id: 'message-1',
      role: 'user',
      parts: [
        { type: 'text', text: 'Jeg trenger noe til båten.' }
      ]
    }
  ],
  pageContext: { pathname: '/produkter', productHandle: null }
}

test('parses the bounded assistant request', () => {
  const parsed = parseAssistantChatRequest(request)

  assert.equal(parsed.intent, 'product_help')
  assert.equal(
    getLastUserText(parsed.messages),
    'Jeg trenger noe til båten.'
  )
})

test('rejects oversized conversation input', () => {
  assert.throws(() =>
    parseAssistantChatRequest({
      ...request,
      messages: Array.from({ length: 13 }, (_, index) => ({
        id: `message-${index}`,
        role: 'user',
        parts: [{ type: 'text', text: 'Hei' }]
      }))
    })
  )
})

test('rejects an oversized user message', () => {
  assert.throws(() =>
    parseAssistantChatRequest({
      ...request,
      messages: [
        {
          id: 'message-long',
          role: 'user',
          parts: [{ type: 'text', text: 'x'.repeat(801) }]
        }
      ]
    })
  )
})

test('rejects source URLs outside the canonical Utekos origin', () => {
  assert.throws(() =>
    assistantSourceSchema.parse({
      title: 'Ekstern kilde',
      url: 'https://example.com/'
    })
  )

  assert.deepEqual(
    assistantSourceSchema.parse({
      title: 'Frakt og retur',
      url: 'https://utekos.no/frakt-og-retur'
    }),
    {
      title: 'Frakt og retur',
      url: 'https://utekos.no/frakt-og-retur'
    }
  )
})

test('returns text from the last user message only', () => {
  const parsed = parseAssistantChatRequest({
    ...request,
    messages: [
      request.messages[0],
      {
        id: 'message-2',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Hva skal den brukes til?' }
        ]
      },
      {
        id: 'message-3',
        role: 'user',
        parts: [{ type: 'text', text: 'På en kald kveldstur.' }]
      }
    ]
  })

  assert.equal(
    getLastUserText(parsed.messages),
    'På en kald kveldstur.'
  )
})

test('projects only text parts before the next request', () => {
  const messages: AssistantUIMessage[] = [
    {
      id: 'message-1',
      role: 'user',
      parts: [
        { type: 'text', text: 'Jeg trenger noe til båten.' }
      ]
    },
    {
      id: 'message-2',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Jeg anbefaler Comfyrobe.' },
        {
          type: 'data-recommendation',
          data: {
            rank: 1,
            reason: 'Holder deg varm på kalde båtturer.',
            isPrimary: true,
            product: {
              id: 'gid://shopify/Product/1',
              handle: 'comfyrobe',
              title: 'Comfyrobe',
              href: '/produkter/comfyrobe',
              image: null,
              price: { amount: '2499.00', currencyCode: 'NOK' },
              variants: []
            }
          }
        },
        {
          type: 'data-source',
          data: {
            title: 'Produktinformasjon',
            url: 'https://utekos.no/comfyrobe'
          }
        },
        {
          type: 'data-handoff',
          data: {
            contactPath: '/kontaktskjema',
            email: 'kundeservice@utekos.no',
            phone: '+4740216343',
            reason: 'uncertain'
          }
        },
        {
          type: 'data-status',
          data: { confidence: 'high', failureCode: 'none' }
        }
      ]
    }
  ]

  assert.deepEqual(projectTextOnlyMessages(messages), [
    {
      id: 'message-1',
      role: 'user',
      parts: [
        { type: 'text', text: 'Jeg trenger noe til båten.' }
      ]
    },
    {
      id: 'message-2',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Jeg anbefaler Comfyrobe.' }]
    }
  ])
})
