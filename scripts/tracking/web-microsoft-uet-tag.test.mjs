import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const contract = JSON.parse(
  readFileSync(
    new URL(
      '../../config/gtm/web-microsoft-uet-native.json',
      import.meta.url
    ),
    'utf8'
  )
)

function evaluateJavascriptVariable(source, replacements) {
  const executable = Object.entries(replacements).reduce(
    (current, [placeholder, value]) =>
      current.replaceAll(placeholder, JSON.stringify(value)),
    source
  )

  return vm.runInNewContext(`(${executable})()`)
}

test('uses the official native Microsoft UET tag contract', () => {
  assert.equal(contract.tag.type, 'baut')
  assert.equal(contract.tag.queueName, 'uetq')
  assert.equal(contract.tag.eventAction, '{{Event}}')
  assert.equal(contract.tag.firingOption, 'oncePerEvent')
  assert.deepEqual(contract.tag.trigger, {
    id: '122',
    name: 'Canonical Microsoft business events',
    type: 'customEvent',
    eventNamePattern:
      '^(view_item_list|select_item|view_item|add_to_cart|begin_checkout|search|generate_lead)$'
  })
  assert.deepEqual(contract.tag.consentTypes, [
    'ad_storage',
    'ad_user_data',
    'ad_personalization'
  ])
})

test('maps canonical event identity and complete commerce values', () => {
  assert.deepEqual(contract.tag.customParameters, {
    event_category: '{{Event}}',
    event_label: '{{DLV - event_id}}',
    event_value: '{{DLV - commerce.value}}',
    revenue_value: '{{DLV - commerce.value}}',
    currency: '{{DLV - commerce.currency}}',
    event_id: '{{DLV - event_id}}',
    ecomm_pagetype: '{{Microsoft UET - page type}}',
    ecomm_totalvalue: '{{DLV - commerce.value}}',
    ecomm_prodid: '{{Microsoft UET - product IDs}}'
  })
})

test('normalizes Shopify variant GIDs for Microsoft dynamic remarketing', () => {
  const ids = evaluateJavascriptVariable(
    contract.javascriptVariables['Microsoft UET - product IDs'],
    {
      '{{DLV - commerce.items}}': [
        {
          item_id:
            'gid://shopify/ProductVariant/42903234609400'
        },
        { variant_id: 'merchant-sku-2' },
        { item_id: 'gid://shopify/Product/invalid' }
      ]
    }
  )

  assert.deepEqual(Array.from(ids), [
    '42903234609400',
    'merchant-sku-2'
  ])
})

test('maps CanonicalEvent names to Microsoft page types', () => {
  const source =
    contract.javascriptVariables['Microsoft UET - page type']

  assert.equal(
    evaluateJavascriptVariable(source, {
      '{{Event}}': 'add_to_cart'
    }),
    'cart'
  )
  assert.equal(
    evaluateJavascriptVariable(source, {
      '{{Event}}': 'view_item_list'
    }),
    'category'
  )
  assert.equal(
    evaluateJavascriptVariable(source, {
      '{{Event}}': 'unknown_event'
    }),
    'other'
  )
})
