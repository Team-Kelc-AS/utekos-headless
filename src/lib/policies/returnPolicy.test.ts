import assert from 'node:assert/strict'
import test from 'node:test'

import { merchantReturnPolicyExpected } from '@/lib/policies/merchantReturnPolicyExpected'
import { merchantReturnPolicyJsonLd } from '@/lib/policies/merchantReturnPolicyJsonLd'
import { renderShopifyRefundPolicyHtml } from '@/lib/policies/renderShopifyRefundPolicyHtml'
import {
  returnPolicy,
  returnPolicyCopy,
  returnPolicyLlmsSummary
} from '@/lib/policies/returnPolicy'
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
    merchantReturnPolicyJsonLd['@id'],
    'https://utekos.no/#return-policy-no'
  )
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
