import assert from 'node:assert/strict'
import test from 'node:test'
import {
  parseAssistantChatRequest,
  type AssistantUIMessage
} from '@/lib/customer-assistant/assistantProtocol'
import { Chat } from '@ai-sdk/react'
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  DefaultChatTransport
} from 'ai'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  AssistantLiveAnnouncer,
  AssistantMessageList
} from './AssistantMessageList'
import {
  allowsAssistantSurface,
  createAssistantRequestBody,
  createAssistantViewRows,
  createCompletedAssistantAnnouncement,
  createHandoffSummary,
  recordAssistantFeedback,
  resolveAssistantAnnouncementText,
  resolveCompletedAssistantSuppressionId,
  type AssistantFeedbackState
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

test('redacts exact Norwegian order labels with short numbers while preserving useful context', () => {
  const summary = createHandoffSummary([
    {
      id: 'order-labels',
      role: 'user',
      parts: [
        {
          type: 'text',
          text: 'Fargen er blå. Ordrenummer: 12345 gjelder retur. Ordrenr. 67890 gjelder bytte.'
        }
      ]
    }
  ])

  assert.match(summary, /Fargen er blå/u)
  assert.match(summary, /gjelder retur/u)
  assert.match(summary, /gjelder bytte/u)
  assert.doesNotMatch(summary, /Ordrenummer:\s*12345/iu)
  assert.doesNotMatch(summary, /Ordrenr\.\s*67890/iu)
  assert.doesNotMatch(summary, /\b(?:12345|67890)\b/u)
})

test('builds a receiving-schema-safe request from projected UI messages and page context', () => {
  const oversizedMessages: AssistantUIMessage[] = Array.from(
    { length: 14 },
    (_, index) => ({
      id: `message-${index}`,
      role: index % 2 === 0 ? 'user' : 'assistant',
      parts: [
        { type: 'text', text: '   ' },
        { type: 'text', text: 'A'.repeat(1_200) },
        { type: 'text', text: 'Andre del' },
        { type: 'text', text: 'Tredje del' },
        { type: 'text', text: 'Fjerde del' },
        { type: 'text', text: 'Femte del skal utelates' }
      ]
    })
  )

  const request = createAssistantRequestBody({
    id: `request-${'x'.repeat(120)}`,
    sessionId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
    intent: 'product_help',
    messages: oversizedMessages,
    pathname: `/${'p'.repeat(400)}`,
    productHandle: 'Ugyldig Handle'
  })

  assert.deepEqual(parseAssistantChatRequest(request), request)
  assert.equal(request.id?.length, 100)
  assert.equal(request.messages.length, 12)
  assert.equal(request.pageContext.pathname.length, 300)
  assert.equal(request.pageContext.productHandle, null)
  for (const message of request.messages) {
    assert.equal(message.parts.length, 4)
    assert.ok(
      message.parts.every(part => part.text.trim().length > 0)
    )
    assert.ok(
      message.parts.every(part => part.text.length <= 800)
    )
  }

  const fallbackContext = createAssistantRequestBody({
    sessionId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
    intent: 'product_help',
    messages: oversizedMessages.slice(-1),
    pathname: 'produkter/comfyrobe',
    productHandle: 'comfyrobe'
  })
  assert.deepEqual(fallbackContext.pageContext, {
    pathname: '/',
    productHandle: 'comfyrobe'
  })
})

test('keeps feedback one-shot when controlled conversation state is rendered again', () => {
  const initial: AssistantFeedbackState = {}
  const selected = recordAssistantFeedback(
    initial,
    'message-assistant',
    'helpful'
  )
  const unchanged = recordAssistantFeedback(
    selected,
    'message-assistant',
    'not_helpful'
  )

  assert.deepEqual(selected, { 'message-assistant': 'helpful' })
  assert.strictEqual(unchanged, selected)

  function renderFeedback(feedback: AssistantFeedbackState) {
    return renderToStaticMarkup(
      createElement(AssistantMessageList, {
        feedback,
        messages: [
          {
            id: 'message-assistant',
            role: 'assistant',
            parts: [
              { type: 'text', text: 'Et ferdig svar.' },
              {
                type: 'data-status',
                data: { confidence: 'high', failureCode: 'none' }
              }
            ]
          }
        ],
        status: 'ready',
        onFeedbackSelect: () => undefined
      })
    )
  }

  const selectedHtml = renderFeedback(selected)
  const remountedHtml = renderFeedback(selected)
  assert.match(selectedHtml, /aria-pressed="true"/u)
  assert.equal(selectedHtml.match(/disabled=""/gu)?.length, 2)
  assert.equal(remountedHtml, selectedHtml)
})

test('announces only the newest completed response and suppresses stale reopen content', () => {
  const announcementMessages: AssistantUIMessage[] = [
    {
      id: 'old-answer',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Gammelt svar.' },
        {
          type: 'data-status',
          data: { confidence: 'high', failureCode: 'none' }
        }
      ]
    },
    {
      id: 'latest-answer',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'Nyeste svar.' },
        { type: 'text', text: 'Kun dette skal annonseres.' },
        {
          type: 'data-status',
          data: { confidence: 'medium', failureCode: 'none' }
        }
      ]
    }
  ]
  const completed = createCompletedAssistantAnnouncement(
    announcementMessages,
    'ready'
  )

  assert.deepEqual(completed, {
    messageId: 'latest-answer',
    text: 'Kjøpshjelp: Nyeste svar. Kun dette skal annonseres.'
  })
  assert.equal(
    createCompletedAssistantAnnouncement(
      announcementMessages,
      'streaming'
    ),
    null
  )
  assert.equal(
    resolveAssistantAnnouncementText(completed, false, null),
    ''
  )
  assert.equal(
    resolveAssistantAnnouncementText(
      completed,
      true,
      'latest-answer'
    ),
    ''
  )
  assert.equal(
    resolveAssistantAnnouncementText(completed, true, null),
    completed?.text
  )

  const emptyLiveRegion = renderToStaticMarkup(
    createElement(AssistantLiveAnnouncer, { text: '' })
  )
  assert.match(emptyLiveRegion, /aria-live="polite"/u)
  assert.match(emptyLiveRegion, /aria-atomic="true"/u)
  assert.doesNotMatch(emptyLiveRegion, /Gammelt|Nyeste/u)
})

test('suppresses completed responses without hiding a streaming response that finishes after reopen', () => {
  const streamingMessages: AssistantUIMessage[] = [
    {
      id: 'streaming-answer',
      role: 'assistant',
      parts: [{ type: 'text', text: 'Nytt svar pågår.' }]
    }
  ]
  const streamingAnnouncement =
    createCompletedAssistantAnnouncement(
      streamingMessages,
      'streaming'
    )

  // Close while streaming and reopen before completion: suppress nothing.
  const suppressedOnStreamingClose =
    resolveCompletedAssistantSuppressionId(streamingAnnouncement)
  const suppressedOnStreamingReopen =
    resolveCompletedAssistantSuppressionId(streamingAnnouncement)
  assert.equal(suppressedOnStreamingClose, null)
  assert.equal(suppressedOnStreamingReopen, null)

  const completedStreamingAnswer =
    createCompletedAssistantAnnouncement(
      [
        {
          ...streamingMessages[0],
          parts: [
            { type: 'text', text: 'Nytt svar er ferdig.' },
            {
              type: 'data-status',
              data: { confidence: 'high', failureCode: 'none' }
            }
          ]
        }
      ],
      'ready'
    )
  assert.equal(
    resolveAssistantAnnouncementText(
      completedStreamingAnswer,
      true,
      suppressedOnStreamingReopen
    ),
    'Kjøpshjelp: Nytt svar er ferdig.'
  )

  // Completion while closed is suppressed when the panel later opens.
  assert.equal(
    resolveAssistantAnnouncementText(
      completedStreamingAnswer,
      false,
      suppressedOnStreamingClose
    ),
    ''
  )
  const suppressedAfterHiddenCompletion =
    resolveCompletedAssistantSuppressionId(
      completedStreamingAnswer
    )
  assert.equal(
    suppressedAfterHiddenCompletion,
    'streaming-answer'
  )
  assert.equal(
    resolveAssistantAnnouncementText(
      completedStreamingAnswer,
      true,
      suppressedAfterHiddenCompletion
    ),
    ''
  )

  // A completed visible response stays suppressed after close/reopen.
  const visibleCompletion = {
    messageId: 'visible-answer',
    text: 'Kjøpshjelp: Synlig ferdig svar.'
  }
  assert.equal(
    resolveAssistantAnnouncementText(
      visibleCompletion,
      true,
      suppressedAfterHiddenCompletion
    ),
    visibleCompletion.text
  )
  const suppressedVisibleCompletion =
    resolveCompletedAssistantSuppressionId(visibleCompletion)
  assert.equal(
    resolveAssistantAnnouncementText(
      visibleCompletion,
      true,
      suppressedVisibleCompletion
    ),
    ''
  )

  // A later, different completed response still announces normally.
  const laterCompletion = {
    messageId: 'later-answer',
    text: 'Kjøpshjelp: Senere ferdig svar.'
  }
  assert.equal(
    resolveAssistantAnnouncementText(
      laterCompletion,
      true,
      suppressedVisibleCompletion
    ),
    laterCompletion.text
  )
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

test('bounds a long first answer in a valid two-turn public chat transport request', async () => {
  const requestBodies: unknown[] = []
  const longAnswer = 'V'.repeat(2_000)
  const chat = new Chat<AssistantUIMessage>({
    id: 'two-turn-runtime-test',
    transport: new DefaultChatTransport<AssistantUIMessage>({
      api: '/api/customer-assistant/chat',
      fetch: async (_input, init) => {
        requestBodies.push(JSON.parse(String(init?.body)))
        const answer =
          requestBodies.length === 1 ? longAnswer : 'Andre svar.'

        return createUIMessageStreamResponse({
          stream: createUIMessageStream<AssistantUIMessage>({
            execute: ({ writer }) => {
              writer.write({ type: 'text-start', id: 'answer' })
              writer.write({
                type: 'text-delta',
                id: 'answer',
                delta: answer
              })
              writer.write({ type: 'text-end', id: 'answer' })
              writer.write({
                type: 'data-status',
                data: { confidence: 'high', failureCode: 'none' }
              })
            }
          })
        })
      },
      prepareSendMessagesRequest: ({
        body,
        id,
        messages: nextMessages
      }) => ({
        body: createAssistantRequestBody({
          id,
          sessionId: body?.sessionId,
          intent: body?.intent,
          messages: nextMessages,
          pathname: '/produkter/comfyrobe',
          productHandle: 'comfyrobe'
        })
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

  const firstAssistantText = chat.messages
    .at(-1)
    ?.parts.find(part => part.type === 'text')
  assert.equal(firstAssistantText?.text.length, 2_000)

  await chat.sendMessage(
    { text: 'Hva med størrelse?' },
    {
      body: {
        sessionId: 'd8b18b30-9ce4-4a55-b40f-ffbc3bda9aa7',
        intent: 'size_help'
      }
    }
  )

  assert.equal(chat.status, 'ready')
  assert.equal(requestBodies.length, 2)
  const secondRequest = parseAssistantChatRequest(
    requestBodies[1]
  )
  assert.deepEqual(secondRequest.pageContext, {
    pathname: '/produkter/comfyrobe',
    productHandle: 'comfyrobe'
  })
  assert.equal(secondRequest.intent, 'size_help')
  assert.equal(secondRequest.messages.length, 3)
  const projectedAnswer = secondRequest.messages.find(
    message => message.role === 'assistant'
  )
  assert.equal(projectedAnswer?.parts.length, 1)
  assert.equal(projectedAnswer?.parts[0]?.text.length, 800)
  assert.equal(projectedAnswer?.parts[0]?.text, 'V'.repeat(800))
})
