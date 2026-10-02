import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildSelectPromotionDataLayerEvent,
  canonicalSelectPromotionCustomDataSchema,
  createCanonicalSelectPromotion
} from '@/lib/analytics/selectPromotionEvent'
import {
  buildViewPromotionDataLayerEvent,
  canonicalViewPromotionCustomDataSchema,
  createCanonicalViewPromotion
} from '@/lib/analytics/viewPromotionEvent'

const consent = {
  analytics: 'granted',
  marketing: 'granted',
  preferences: 'granted',
  source: 'cookiebot',
  version: 'test'
} as const

test('view_promotion preserves GA4 promotion name and creative slot', () => {
  const customData =
    canonicalViewPromotionCustomDataSchema.parse({
      promotion_id: 'comfyrobe-hero',
      promotion_name: 'Comfyrobe',
      creative_name: 'Hero',
      creative_slot: 'hero',
      impression_sequence: 1
    })
  const event = createCanonicalViewPromotion({
    consent,
    customData,
    environment: 'test',
    eventId: '56e988cf-5811-4c51-b962-105a0629a0b0',
    eventTime: '2026-07-24T08:00:00.000Z',
    pageTitle: 'Comfyrobe',
    pageUrl: 'https://utekos.no/comfyrobe',
    pageViewId: '13754adb-1c23-41b7-b55c-6cf4eaa5ca74'
  })

  assert.equal(event.custom_data.promotion_name, 'Comfyrobe')
  assert.equal(event.custom_data.creative_slot, 'hero')
  assert.deepEqual(
    buildViewPromotionDataLayerEvent(event).custom_data,
    customData
  )
})

test('select_promotion preserves the matching promotion identity', () => {
  const customData =
    canonicalSelectPromotionCustomDataSchema.parse({
      interaction_id: 'hero-primary-click',
      promotion_id: 'comfyrobe-hero',
      promotion_name: 'Comfyrobe',
      creative_name: 'Velg størrelse',
      creative_slot: 'primary_cta'
    })
  const event = createCanonicalSelectPromotion({
    consent,
    customData,
    environment: 'test',
    eventId: '96dac0ef-b0d2-48e6-b41e-68e14db22720',
    eventTime: '2026-07-24T08:00:01.000Z',
    pageTitle: 'Comfyrobe',
    pageUrl: 'https://utekos.no/comfyrobe',
    pageViewId: '13754adb-1c23-41b7-b55c-6cf4eaa5ca74'
  })

  assert.equal(event.custom_data.promotion_id, 'comfyrobe-hero')
  assert.equal(event.custom_data.creative_slot, 'primary_cta')
  assert.deepEqual(
    buildSelectPromotionDataLayerEvent(event).custom_data,
    customData
  )
})
