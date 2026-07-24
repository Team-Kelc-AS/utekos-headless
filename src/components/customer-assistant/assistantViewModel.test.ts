import assert from 'node:assert/strict'
import test from 'node:test'
import {
  projectTextOnlyMessages,
  type AssistantUIMessage
} from '@/lib/customer-assistant/assistantProtocol'
import { Chat } from '@ai-sdk/react'
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  DefaultChatTransport
} from 'ai'
import {
  allowsAssistantSurface,
  createAssistantViewRows,
  createHandoffSummary
} from './assistantViewModel'

const recommendation = {
  rank: 1 as const,
  reason: 'Holder deg varm på kalde båtturer.',
  isPrimary: true,
  product: {
    id: 'gid://shopify/Product/1',
    handle: 'comfyrobe',
    title: 'Comfyrobe',
    href: '/produkter/comfyrobe',
    image: {
      alt: 'Comfyrobe i blått',
      url: 'https://cdn.shopify.com/s/files/1/comfyrobe.webp'
    },
    price: { amount: '2499.00', currencyCode: 'NOK' },
    variants: [
      {
        id: 'gid://shopify/ProductVariant/1',
        title: 'M/L',
        availableForSale: true,
        selectedOptions: [{ name: 'Størrelse', value: 'M/L' }]
      }
    ]
  }
}

const messages: AssistantUIMessage[] = [
  {
    id: 'message-user',
    role: 'user',
    parts: [{ type: 'text', text: 'Jeg trenger noe til båten.' }]
  },
  {
    id: 'message-assistant',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'Jeg anbefaler Comfyrobe.' },
      { type: 'data-recommendation', data: recommendation },
      {
        type: 'data-source',
        data: {
          title: 'Frakt og retur',
          url: 'https://utekos.no/frakt-og-retur'
        }
      },
      {
        type: 'data-source',
        data: {
          title: 'Ugyldig ekstern kilde',
          url: 'https://example.com/frakt'
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
        data: { confidence: 'medium', failureCode: 'none' }
      }
    ]
  }
]

test('converts text parts to user and assistant bubble rows', () => {
  const rows = createAssistantViewRows(messages)
  const textRows = rows.filter(row => row.kind === 'text')

  assert.deepEqual(textRows, [
    {
      kind: 'text',
      id: 'message-user:text:0',
      messageId: 'message-user',
      role: 'user',
      text: 'Jeg trenger noe til båten.'
    },
    {
      kind: 'text',
      id: 'message-assistant:text:0',
      messageId: 'message-assistant',
      role: 'assistant',
      text: 'Jeg anbefaler Comfyrobe.'
    }
  ])
})

test('converts typed recommendation parts to product-card rows', () => {
  const rows = createAssistantViewRows(messages)

  assert.deepEqual(
    rows.filter(row => row.kind === 'recommendation'),
    [
      {
        kind: 'recommendation',
        id: 'message-assistant:recommendation:1',
        messageId: 'message-assistant',
        recommendation
      }
    ]
  )
})

test('keeps source rows only for the canonical Utekos origin', () => {
  const rows = createAssistantViewRows(messages)

  assert.deepEqual(
    rows.filter(row => row.kind === 'source'),
    [
      {
        kind: 'source',
        id: 'message-assistant:source:2',
        messageId: 'message-assistant',
        source: {
          title: 'Frakt og retur',
          url: 'https://utekos.no/frakt-og-retur'
        }
      }
    ]
  )
})

test('converts handoff parts to the exact approved contact actions', () => {
  const rows = createAssistantViewRows(messages)

  assert.deepEqual(
    rows.filter(row => row.kind === 'handoff'),
    [
      {
        kind: 'handoff',
        id: 'message-assistant:handoff:4',
        messageId: 'message-assistant',
        handoff: {
          contactPath: '/kontaktskjema',
          emailHref: 'mailto:kundeservice@utekos.no',
          emailLabel: 'kundeservice@utekos.no',
          phoneHref: 'tel:+4740216343',
          phoneLabel: '+47 40 21 63 43',
          reason: 'uncertain'
        }
      }
    ]
  )
})

test('converts status parts to non-text completion metadata', () => {
  const rows = createAssistantViewRows(messages)

  assert.deepEqual(
    rows.filter(row => row.kind === 'status'),
    [
      {
        kind: 'status',
        id: 'message-assistant:status:5',
        messageId: 'message-assistant',
        confidence: 'medium',
        failureCode: 'none'
      }
    ]
  )
})

test('drops malformed structured parts instead of rendering untrusted values', () => {
  const malformedMessage = {
    id: 'malformed-message',
    role: 'assistant',
    parts: [
      {
        type: 'data-recommendation',
        data: {
          ...recommendation,
          product: {
            ...recommendation.product,
            image: {
              alt: 'Utrygt bilde',
              url: 'https://example.com/untrusted.webp'
            }
          }
        }
      },
      {
        type: 'data-handoff',
        data: {
          contactPath: '/ukjent',
          email: 'unknown@example.com',
          phone: '+4700000000',
          reason: 'uncertain'
        }
      },
      {
        type: 'data-status',
        data: { confidence: 'certain', failureCode: 'none' }
      }
    ]
  } as unknown as AssistantUIMessage

  assert.deepEqual(
    createAssistantViewRows([malformedMessage]),
    []
  )
})

test('creates a local handoff summary bounded to 1,000 characters', () => {
  const summary = createHandoffSummary([
    ...messages,
    {
      id: 'long-message',
      role: 'user',
      parts: [
        {
          type: 'text',
          text: `Jeg ønsker en varm modell til båten. ${'Trygg kontekst. '.repeat(100)}`
        }
      ]
    }
  ])

  assert.ok(summary.length <= 1_000)
  assert.match(summary, /varm modell til båten/u)
})

test('redacts email, phone, order-looking and payment-looking values from the summary', () => {
  const summary = createHandoffSummary([
    {
      id: 'private-message',
      role: 'user',
      parts: [
        {
          type: 'text',
          text: 'Jeg trenger hjelp med ORD-84729163. E-post ola.nordmann@example.no, telefon +47 402 16 343 og kort 4242 4242 4242 4242.'
        }
      ]
    },
    {
      id: 'safe-answer',
      role: 'assistant',
      parts: [
        {
          type: 'text',
          text: 'Kundeservice kan hjelpe med saken.'
        }
      ]
    }
  ])

  assert.match(summary, /Kundeservice kan hjelpe/u)
  assert.doesNotMatch(summary, /ola\.nordmann@example\.no/iu)
  assert.doesNotMatch(summary, /402[\s-]*16[\s-]*343/u)
  assert.doesNotMatch(summary, /ORD-84729163/iu)
  assert.doesNotMatch(summary, /4242[\s-]*4242/iu)
})

test('fails closed for invalid rollout values without choosing an exposure bucket', () => {
  for (const rolloutPercent of [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    -1,
    0,
    100.01,
    101
  ]) {
    assert.equal(allowsAssistantSurface(rolloutPercent), false)
  }

  for (const rolloutPercent of [0.01, 25, 100]) {
    assert.equal(allowsAssistantSurface(rolloutPercent), true)
  }
})

test('parses AI SDK 6 UI chunks through the public React SDK chat runtime', async () => {
  let requestBody: unknown
  const response = createUIMessageStreamResponse({
    stream: createUIMessageStream<AssistantUIMessage>({
      execute: ({ writer }) => {
        writer.write({ type: 'text-start', id: 'answer' })
        writer.write({
          type: 'text-delta',
          id: 'answer',
          delta: 'Jeg fant et relevant produkt.'
        })
        writer.write({ type: 'text-end', id: 'answer' })
        writer.write({
          type: 'data-status',
          data: { confidence: 'high', failureCode: 'none' }
        })
      }
    })
  })
  const chat = new Chat<AssistantUIMessage>({
    id: 'cross-major-runtime-test',
    transport: new DefaultChatTransport<AssistantUIMessage>({
      api: '/api/customer-assistant/chat',
      fetch: async (_input, init) => {
        requestBody = JSON.parse(String(init?.body))
        return response
      },
      prepareSendMessagesRequest: ({
        body,
        id,
        messages: nextMessages
      }) => ({
        body: {
          id,
          sessionId: body?.sessionId,
          intent: body?.intent,
          messages: projectTextOnlyMessages(nextMessages)
        }
      })
    })
  })

  await chat.sendMessage(
    { text: 'Finn noe varmt.' },
    {
      body: {
        sessionId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
        intent: 'product_help'
      }
    }
  )

  assert.equal(chat.status, 'ready')
  assert.deepEqual(requestBody, {
    id: 'cross-major-runtime-test',
    sessionId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
    intent: 'product_help',
    messages: [
      {
        id: chat.messages[0]?.id,
        role: 'user',
        parts: [{ type: 'text', text: 'Finn noe varmt.' }]
      }
    ]
  })

  const assistantMessage = chat.messages.at(-1)
  assert.equal(assistantMessage?.role, 'assistant')
  assert.deepEqual(assistantMessage?.parts, [
    {
      type: 'text',
      text: 'Jeg fant et relevant produkt.',
      providerMetadata: undefined,
      state: 'done'
    },
    {
      type: 'data-status',
      data: { confidence: 'high', failureCode: 'none' }
    }
  ])
})
