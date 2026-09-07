import assert from 'node:assert/strict'
import test from 'node:test'
import { techDownData } from './data'
import { techDownSizeCards } from './techDownSizeCards'
import { techDownSizeSummary } from './techDownSizeSummary'
import { TECH_DOWN_PUBLIC_SIZES } from '@/lib/products/presentation/techDownSizeContract'
import { formatTechDownSizeFacts } from '@/app/nbcc/utils/formatTechDownSizeFacts'
import { FALLBACK_SUMMARIES } from '@/app/nbcc/constants'
import { buildAssistantKnowledgeDocuments } from '@/lib/google/customer-assistant/knowledgeManifest'
import { sizeExchangeLlmsSummary } from '@/lib/policies/returnPolicy'
import { staticSupportKnowledgeAdapter } from '@/lib/customer-assistant/server/staticSupportKnowledge'

test('all TechDown advice uses current labels and approved height intervals', () => {
  assert.deepEqual(
    techDownSizeCards.map(card => card.size),
    TECH_DOWN_PUBLIC_SIZES
  )
  assert.deepEqual(
    techDownSizeCards.map(card => card.heightGuide),
    ['165–175 cm', '175–185 cm', '185 cm og høyere']
  )
  assert.match(
    techDownSizeCards[1].fitGuidance.join(' '),
    /180 cm.*185 cm/
  )
  assert.match(
    techDownSizeCards[2].fitGuidance.join(' '),
    /kraftig bygget/
  )
  assert.deepEqual(
    FALLBACK_SUMMARIES.sizes.sections[0]?.items,
    techDownSizeSummary
  )
})

test('NBCC and assistant corpus receive all nine current measurement rows', () => {
  const facts = formatTechDownSizeFacts()
  assert.equal(facts.split('\n').length, 9)
  const sizeDocument = buildAssistantKnowledgeDocuments().find(
    document => document.id === 'size-guide'
  )
  assert.ok(sizeDocument)
  for (const row of techDownData) {
    assert.ok(
      facts.includes(
        `Middels ${row.middels}, Stor ${row.stor}, Større ${row.storre}`
      )
    )
  }
  assert.ok(sizeDocument.content.includes(facts))
  assert.doesNotMatch(
    sizeDocument.content,
    /Liten|195 cm|Ekstra Stor/
  )
})

test('support answers size-exchange questions with full qualified policy', async () => {
  for (const question of [
    'Kan jeg bytte gratis til en annen størrelse?',
    'Jeg har kjøpt feil størrelse.'
  ]) {
    const result = await staticSupportKnowledgeAdapter.answer({
      question,
      productHandle: null
    })
    assert.equal(result.text, sizeExchangeLlmsSummary)
    assert.ok(result.text.length <= 2_000)
    assert.equal(result.confidence, 'high')
  }
})
