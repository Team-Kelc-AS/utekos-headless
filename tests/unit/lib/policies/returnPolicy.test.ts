import assert from 'node:assert/strict'
import test from 'node:test'

import { merchantReturnPolicyExpected } from '@/lib/policies/merchantReturnPolicyExpected'
import { merchantReturnPolicyJsonLd } from '@/lib/policies/merchantReturnPolicyJsonLd'
import { renderShopifyRefundPolicyHtml } from '@/lib/policies/renderShopifyRefundPolicyHtml'
import {
  returnPolicy,
  returnPolicyCopy,
  returnPolicyLlmsSummary,
  sizeExchangeCopy,
  sizeExchangeLlmsSummary
} from '@/lib/policies/returnPolicy'
import { shippingReturnsFaqItems } from '@/app/frakt-og-retur/data/shippingReturnsContent'
import { returnPolicyPageMetadata } from '@/lib/policies/returnPolicyMetadata'

test('the canonical return policy contains every operational fact', () => {
  assert.equal(returnPolicy.applicableCountry, 'NO')
  assert.equal(returnPolicy.returnWindowDays, 14)
  assert.equal(returnPolicy.returnAfterNoticeDays, 14)
  assert.deepEqual(returnPolicy.processRefundBusinessDays, {
    minimum: 1,
    maximum: 3
  })
  assert.equal(
    returnPolicy.returnAddress.streetAddress,
    'Lille Damsgårdsveien 25'
  )
  assert.equal(returnPolicy.customerPaysReturnShipping, true)
  assert.equal(returnPolicy.acceptsExchanges, true)
})

test('size exchange is an explicit limited benefit, never general free returns', () => {
  assert.deepEqual(returnPolicy.sizeExchange, {
    appliesTo: 'active-garments-with-size-options',
    sameModelAndColorOnly: true,
    noticeWindowDays: 14,
    noticeWindowStartsAt: 'physical-receipt',
    returnShippingPaidBy: 'utekos',
    contactEmail: 'kundeservice@kelc.no',
    contactPhone: '+47 402 16 343',
    contactPhoneHref: 'tel:+4740216343',
    replacementDispatchTrigger: 'documented-return-handover',
    subjectToStock: true,
    outOfStockResolution: 'agree-refund-or-alternative',
    itemCondition:
      'unused-unwashed-unaltered-no-odour-or-stains-tags-attached'
  })
  assert.equal(returnPolicy.lastUpdated, '2026-09-07')
  assert.equal(
    returnPolicy.contactEmail,
    'kundeservice@utekos.no'
  )
  assert.equal(returnPolicy.customerPaysReturnShipping, true)
  assert.equal(returnPolicy.customerCreatesReturnLabel, true)
  assert.equal(merchantReturnPolicyExpected.acceptExchange, true)
  assert.equal(
    merchantReturnPolicyExpected.returnShippingFee.type,
    'CUSTOMER_PAYING_ACTUAL_FEE'
  )
  assert.equal(
    merchantReturnPolicyJsonLd.customerRemorseReturnFees,
    'https://schema.org/ReturnFeesCustomerResponsibility'
  )
})

test('Shopify, shipping FAQ and LLM policy share every exchange condition', () => {
  const html = renderShopifyRefundPolicyHtml()
  const faq = shippingReturnsFaqItems.find(
    item => item.id === 'size-exchange'
  )
  assert.equal(faq?.answer, sizeExchangeLlmsSummary)
  for (const copy of Object.values(sizeExchangeCopy)) {
    assert.ok(html.includes(copy))
    assert.ok(returnPolicyLlmsSummary.includes(copy))
  }
  assert.ok(html.includes(returnPolicyCopy.returnShipping))
  assert.match(html, /mailto:kundeservice@kelc.no/)
  assert.match(html, /tel:\+4740216343/)
})

test('metadata never promises free returns and uses the canonical page', () => {
  const metadataText = JSON.stringify(returnPolicyPageMetadata)

  assert.doesNotMatch(metadataText, /gratis retur|fri retur/i)
  assert.equal(
    returnPolicyPageMetadata.alternates.canonical,
    '/frakt-og-retur'
  )
  assert.equal(returnPolicyPageMetadata.robots.index, true)
  assert.equal(returnPolicyPageMetadata.robots.follow, true)
})

test('JSON-LD exposes the complete organization return policy', () => {
  assert.equal(
    merchantReturnPolicyJsonLd.merchantReturnDays,
    returnPolicy.returnWindowDays
  )
  assert.equal(
    merchantReturnPolicyJsonLd.merchantReturnLink,
    returnPolicy.pageUrl
  )
  assert.equal(
    merchantReturnPolicyJsonLd.returnFees,
    'https://schema.org/ReturnFeesCustomerResponsibility'
  )
  assert.equal(
    merchantReturnPolicyJsonLd.itemDefectReturnFees,
    'https://schema.org/FreeReturn'
  )
})

test('Shopify policy HTML is generated from the canonical contract', () => {
  const html = renderShopifyRefundPolicyHtml()

  assert.ok(html.includes(returnPolicy.contactEmail))
  assert.ok(
    html.includes(returnPolicy.returnAddress.streetAddress)
  )
  assert.ok(html.includes(returnPolicyCopy.refund))
  assert.ok(html.includes(returnPolicyCopy.condition))
  assert.doesNotMatch(
    html,
    /ferskvarer|forseglede lydopptak|digitale tjenester/i
  )
})

test('Merchant and llms outputs share the canonical facts', () => {
  assert.deepEqual(merchantReturnPolicyExpected.policy, {
    type: 'NUMBER_OF_DAYS_AFTER_DELIVERY',
    days: '14'
  })
  assert.equal(
    merchantReturnPolicyExpected.returnShippingFee.type,
    'CUSTOMER_PAYING_ACTUAL_FEE'
  )
  assert.match(returnPolicyLlmsSummary, /14 kalenderdagers/)
  assert.match(
    returnPolicyLlmsSummary,
    /Lille Damsgårdsveien 25/
  )
  assert.match(returnPolicyLlmsSummary, /1–3 virkedager/)
})
