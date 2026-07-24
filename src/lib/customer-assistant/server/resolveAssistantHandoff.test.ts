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

const inflectionCases = [
  ['Jeg finner ikke ordrenummeret mitt', 'order'],
  ['Jeg trenger hjelp med fakturaen', 'payment'],
  ['Jeg vil følge opp reklamasjonen', 'complaint'],
  ['Her er e-postadressen min', 'personal_data'],
  ['E-postadressen min er kunde@example.no', 'personal_data'],
  ['Kontakt meg på 400 00 000', 'personal_data']
] as const

for (const [text, reason] of inflectionCases) {
  test(`escalates ${reason} inflections safely`, () => {
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

test('does not escalate longer unrelated words', () => {
  assert.equal(
    resolveAssistantHandoff(
      'Fakturering og reklamasjonsrett er generelle temaer.',
      0
    ),
    null
  )
})

test('requires customer-sharing context for general personal-data shapes', () => {
  assert.equal(
    resolveAssistantHandoff(
      'Har dere varen med produktnummer 12345678?',
      0
    ),
    null
  )
  assert.equal(
    resolveAssistantHandoff('Her er produktnummer 12345678.', 0),
    null
  )
  assert.equal(
    resolveAssistantHandoff(
      'Send meg varen med produktnummer 12345678.',
      0
    ),
    null
  )
  assert.equal(
    resolveAssistantHandoff('Hva er adressen til butikken?', 0),
    null
  )
  assert.equal(
    resolveAssistantHandoff(
      'Hva er adressen til butikken der varen min kan hentes?',
      0
    ),
    null
  )
})

const directSharingCases = [
  ['Du kan kontakte meg på kunde@example.no.', 'personal_data'],
  ['Du kan ringe meg på 400 00 000.', 'personal_data'],
  [
    'Kan du sende meg e-post på kunde@example.no?',
    'personal_data'
  ]
] as const

for (const [text, reason] of directSharingCases) {
  test(`escalates direct personal sharing: ${text}`, () => {
    assert.equal(resolveAssistantHandoff(text, 0), reason)
  })
}
