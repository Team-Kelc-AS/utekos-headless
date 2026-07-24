import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveAssistantHandoff } from './resolveAssistantHandoff'

const cases = [
  ['Hvor er ordren min 12345?', 'order'],
  ['Betalingen med Klarna feilet', 'payment'],
  ['Jeg vil reklamere på sømmen', 'complaint'],
  ['Her er telefonnummeret mitt 40000000', 'personal_data']
] as const

for (const [text, reason] of cases) {
  test(`escalates ${reason} requests with word-boundary matching`, () => {
    assert.equal(resolveAssistantHandoff(text, 0), reason)
  })
}

test('escalates after two failures', () => {
  assert.equal(
    resolveAssistantHandoff(
      'Hvilken modell passer best til båt?',
      2
    ),
    'repeated_failure'
  )
})

test('does not escalate an ordinary product question', () => {
  assert.equal(
    resolveAssistantHandoff(
      'Hvilken modell passer best til båt?',
      0
    ),
    null
  )
})
