import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildAssistantKnowledgeDocuments,
  computeAssistantKnowledgeChecksum,
  validateAssistantKnowledgeDocuments
} from './knowledgeManifest'

const canonicalDocuments = [
  [
    'compare-models',
    'https://utekos.no/handlehjelp/sammenlign-modeller',
    'product_advice'
  ],
  [
    'comfyrobe-faq',
    'https://utekos.no/comfyrobe',
    'product_advice'
  ],
  [
    'shipping-returns',
    'https://utekos.no/frakt-og-retur',
    'shipping_returns'
  ],
  [
    'size-guide',
    'https://utekos.no/handlehjelp/storrelsesguide',
    'size'
  ],
  [
    'materials',
    'https://utekos.no/handlehjelp/teknologi-materialer',
    'materials'
  ],
  [
    'care',
    'https://utekos.no/handlehjelp/vask-og-vedlikehold',
    'care'
  ],
  ['contact', 'https://utekos.no/kontaktskjema', 'contact']
] as const

function cloneDocuments() {
  return structuredClone(buildAssistantKnowledgeDocuments())
}

test('builds exactly the seven canonical documents in deterministic order', () => {
  const first = buildAssistantKnowledgeDocuments()
  const second = buildAssistantKnowledgeDocuments()

  assert.deepEqual(first, second)
  assert.deepEqual(
    first.map(({ id, canonicalUrl, contentType }) => [
      id,
      canonicalUrl,
      contentType
    ]),
    canonicalDocuments
  )
  assert.equal(first.length, 7)

  for (const document of first) {
    assert.equal(document.locale, 'nb-NO')
    assert.equal(document.lastReviewed, '2026-07-24')
    assert.equal(document.published, true)
    assert.ok(document.content.trim().length > 0)
    assert.ok(document.content.length <= 20_000)
    assert.match(document.checksum, /^[a-f0-9]{64}$/u)
    assert.equal(
      document.checksum,
      computeAssistantKnowledgeChecksum(document)
    )
  }
})

test('rejects missing, extra, wrong, or reordered canonical documents', () => {
  const missing = cloneDocuments().slice(0, -1)
  assert.throws(
    () => validateAssistantKnowledgeDocuments(missing),
    /exactly 7/u
  )

  const wrongId = cloneDocuments()
  wrongId[0]!.id = 'other'
  assert.throws(
    () => validateAssistantKnowledgeDocuments(wrongId),
    /canonical document at position 1/u
  )

  const reordered = cloneDocuments()
  ;[reordered[0], reordered[1]] = [reordered[1]!, reordered[0]!]
  assert.throws(
    () => validateAssistantKnowledgeDocuments(reordered),
    /canonical document at position 1/u
  )
})

test('rejects duplicate IDs and canonical URLs', () => {
  const duplicateId = cloneDocuments()
  duplicateId[1]!.id = duplicateId[0]!.id
  assert.throws(
    () => validateAssistantKnowledgeDocuments(duplicateId),
    /duplicate document ID/u
  )

  const duplicateUrl = cloneDocuments()
  duplicateUrl[1]!.canonicalUrl = duplicateUrl[0]!.canonicalUrl
  assert.throws(
    () => validateAssistantKnowledgeDocuments(duplicateUrl),
    /duplicate canonical URL/u
  )
})

test('rejects non-canonical origins and invalid document fields', () => {
  const externalUrl = cloneDocuments()
  externalUrl[0]!.canonicalUrl =
    'https://example.com/handlehjelp/sammenlign-modeller' as `https://utekos.no/${string}`
  assert.throws(
    () => validateAssistantKnowledgeDocuments(externalUrl),
    /canonical Utekos URL/u
  )

  const blankContent = cloneDocuments()
  blankContent[0]!.content = '   '
  assert.throws(
    () => validateAssistantKnowledgeDocuments(blankContent),
    /blank content/u
  )

  const oversizedContent = cloneDocuments()
  oversizedContent[0]!.content = 'a'.repeat(20_001)
  assert.throws(
    () => validateAssistantKnowledgeDocuments(oversizedContent),
    /20,000 characters/u
  )

  const wrongReviewDate = cloneDocuments()
  ;(
    wrongReviewDate[0] as { lastReviewed?: string }
  ).lastReviewed = '2026-07-25'
  assert.throws(
    () => validateAssistantKnowledgeDocuments(wrongReviewDate),
    /lastReviewed/u
  )

  const missingReviewDate = cloneDocuments()
  delete (missingReviewDate[0] as { lastReviewed?: string })
    .lastReviewed
  assert.throws(
    () => validateAssistantKnowledgeDocuments(missingReviewDate),
    /lastReviewed/u
  )

  const unpublished = cloneDocuments()
  ;(unpublished[0] as { published: boolean }).published = false
  assert.throws(
    () => validateAssistantKnowledgeDocuments(unpublished),
    /published/u
  )
})

test('rejects invalid and stale SHA-256 checksums', () => {
  const malformed = cloneDocuments()
  malformed[0]!.checksum = 'not-a-sha-256'
  assert.throws(
    () => validateAssistantKnowledgeDocuments(malformed),
    /SHA-256/u
  )

  const stale = cloneDocuments()
  stale[0]!.content += ' Endret uten ny kontrollsum.'
  assert.throws(
    () => validateAssistantKnowledgeDocuments(stale),
    /checksum does not match/u
  )
})

test('contact content uses approved handoff channels without order lookup', () => {
  const contact = buildAssistantKnowledgeDocuments().find(
    document => document.id === 'contact'
  )

  assert.ok(contact)
  assert.match(
    contact.content,
    /https:\/\/utekos\.no\/kontaktskjema/u
  )
  assert.match(contact.content, /kundeservice@utekos\.no/u)
  assert.match(contact.content, /\+47 402 16 343/u)
  assert.match(contact.content, /kan ikke slå opp ordre/u)
  assert.match(
    contact.content,
    /ikke del sensitive opplysninger/iu
  )
})
