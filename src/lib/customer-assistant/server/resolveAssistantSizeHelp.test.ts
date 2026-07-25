import assert from 'node:assert/strict'
import test from 'node:test'
import type { AssistantChatRequest } from '../assistantProtocol'
import { resolveAssistantSizeHelp } from './resolveAssistantSizeHelp'

function request(
  texts: string[],
  productHandle: string | null = null
): AssistantChatRequest {
  return {
    intent: 'size_help',
    messages: texts.flatMap((text, index) => [
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
                text: 'Jeg trenger én opplysning til.'
              }
            ]
          }
        ]
      : [])
    ]),
    pageContext: { pathname: '/', productHandle },
    sessionId: '82d1dd54-4286-484f-a3e1-f6bab157bb71'
  }
}

test('first asks which product the size question concerns', () => {
  const result = resolveAssistantSizeHelp(
    request(['Hjelp meg å velge riktig størrelse.'])
  )

  assert.equal(result.kind, 'clarify')
  assert.match(result.text, /Dun|Mikrofiber|TechDown|Comfyrobe/u)
})

test('asks for height and fit after TechDown is selected', () => {
  const result = resolveAssistantSizeHelp(
    request(['Hjelp meg å velge riktig størrelse.', 'TechDown'])
  )

  assert.equal(result.kind, 'clarify')
  assert.match(result.text, /høy.*centimeter/iu)
  assert.match(result.text, /passform|tykke lag/iu)
})

test('uses TechDown guide thresholds and measurements', () => {
  const result = resolveAssistantSizeHelp(
    request([
      'TechDown',
      'Jeg er 176 cm og ønsker tettere passform.'
    ])
  )

  assert.equal(result.kind, 'answer')
  assert.match(result.text, /Medium \(M\)/u)
  assert.match(result.text, /162 cm/u)
  assert.match(result.text, /ikke en garanti/iu)
})

test('uses Utekos height and layering guidance', () => {
  const result = resolveAssistantSizeHelp(
    request([
      'Det gjelder Mikrofiber.',
      'Jeg er 178 cm og vil ha ekstra plass til tykke lag.'
    ])
  )

  assert.equal(result.kind, 'answer')
  assert.match(result.text, /Large/u)
  assert.match(result.text, /200 cm/u)
})

test('uses usual size and fit for Comfyrobe', () => {
  const result = resolveAssistantSizeHelp(
    request([
      'Comfyrobe',
      'Jeg bruker vanligvis medium og vil ha balansert passform.'
    ])
  )

  assert.equal(result.kind, 'answer')
  assert.match(result.text, /\bM\b/u)
  assert.match(result.text, /105 cm/u)
  assert.match(result.text, /71 cm/u)
})

test('uses product page context when the product is not repeated', () => {
  const result = resolveAssistantSizeHelp(
    request(
      ['Jeg er 182 cm og ønsker ekstra rom til tykke lag.'],
      'utekos-mikrofiber'
    )
  )

  assert.equal(result.kind, 'answer')
  assert.match(result.text, /Large/u)
})
