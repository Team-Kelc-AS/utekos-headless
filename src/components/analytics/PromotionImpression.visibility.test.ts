import assert from 'node:assert/strict'
import test from 'node:test'

test('waits for the configured visible ratio before an impression dwell begins', async () => {
  const promotionModule = await import(
    './promotionIntersectionVisibility'
  ).catch(() => null)

  assert.ok(
    promotionModule,
    'PromotionImpression must implement its visibility decision'
  )

  const partlyRevealed = {
    isIntersecting: true,
    intersectionRatio: 0.49
  }
  const halfRevealed = {
    isIntersecting: true,
    intersectionRatio: 0.5
  }

  assert.equal(
    promotionModule.isPromotionIntersectionVisible(
      partlyRevealed,
      0.5
    ),
    false
  )
  assert.equal(
    promotionModule.isPromotionIntersectionVisible(
      halfRevealed,
      0.5
    ),
    true
  )
})
