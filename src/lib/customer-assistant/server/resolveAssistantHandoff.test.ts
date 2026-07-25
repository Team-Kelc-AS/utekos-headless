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

const directRestrictedCases = [
  ['kunde@example.no', 'personal_data'],
  ['+47 400 00 000', 'personal_data'],
  ['+4740000000', 'personal_data'],
  ['+4740216343', 'personal_data'],
  ['004740000000', 'personal_data'],
  ['004740216343', 'personal_data'],
  ['400 00 000', 'personal_data'],
  ['4111 1111 1111 1111', 'personal_data'],
  ['#12345', 'order'],
  ['UTE-12345', 'order'],
  ['Bestilling UTE-12345 har ikke kommet', 'order'],
  ['Pakken min mangler fortsatt', 'order'],
  ['Kortet mitt blir avvist', 'payment'],
  ['Varen kom skadet', 'complaint'],
  ['Varen er ødelagt', 'complaint'],
  ['Sømmen er defekt', 'complaint']
] as const

for (const [text, reason] of directRestrictedCases) {
  test(`detects common direct restricted input: ${text}`, () => {
    assert.equal(resolveAssistantHandoff(text, 0), reason)
  })
}

test('keeps product-number and store-address questions outside restricted routing', () => {
  for (const text of [
    'Har dere produktnummer 12345678?',
    'Her er produktnummer 12345678.',
    'Hva er adressen til butikken?',
    'Hvor ligger butikken deres?'
  ]) {
    assert.equal(resolveAssistantHandoff(text, 0), null, text)
  }
})

test('keeps labelled product identifiers outside restricted routing', () => {
  for (const text of [
    'Produktnummer 400 00 000',
    'Varenummer 400-00-000',
    'Artikkelnummer 400.00.000',
    'SKU UTE-12345',
    'Modellnummer #12345',
    'Variantnummer UTE-12345',
    'UTE-12345 variantnummer',
    'Variantnummer #12345',
    '#12345 variantnummer',
    'Variantnummer 400 00 000',
    '400 00 000 variantnummer',
    'Produktnummeret er UTE-12345',
    'Varenummeret er 400 00 000',
    'Artikkelnummeret: #12345',
    'Modellnummeret - UTE-12345',
    'Variantnummeret = #12345',
    'SKU = #12345',
    'UTE-12345 (SKU)',
    '#12345, produktnummer',
    'Produktnummeret er +4740000000',
    '004740000000 (SKU)'
  ]) {
    assert.equal(resolveAssistantHandoff(text, 0), null, text)
  }
})

test('a product label exempts only its associated candidate', () => {
  for (const [text, reason] of [
    ['UTE-12345 (SKU), #67890', 'order'],
    ['SKU = #12345, 400 00 000', 'personal_data'],
    [
      'Varenummeret er 400 00 000, 4111 1111 1111 1111',
      'personal_data'
    ],
    ['#12345, SKU = +4740000000', 'order']
  ] as const) {
    assert.equal(resolveAssistantHandoff(text, 0), reason, text)
  }
})

test('formatted phone boundaries treat Unicode numbers as numeric context', () => {
  for (const text of ['١400 00 000٢', '١+4740000000٢']) {
    assert.equal(resolveAssistantHandoff(text, 0), null, text)
  }
})

test('does not classify unlabelled short numbers as orders', () => {
  for (const text of [
    '12345',
    'Har dere størrelse 42?',
    'Jeg trenger 2 produkter.'
  ]) {
    assert.equal(resolveAssistantHandoff(text, 0), null, text)
  }
})
