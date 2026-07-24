import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assistantProductProfiles,
  type ProductProfile
} from '../assistantProductProfiles'
import type { AssistantProduct } from '../assistantProtocol'
import { matchAssistantProducts } from './matchAssistantProducts'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends (
    <Value>() => Value extends Right ? 1 : 2
  ) ?
    true
  : false

type Assert<Value extends true> = Value

type ProductProfileIsDeeplyReadonly = Assert<
  Equal<
    ProductProfile,
    {
      readonly handle:
        | 'utekos-techdown'
        | 'utekos-dun'
        | 'utekos-mikrofiber'
        | 'comfyrobe'
      readonly cues: readonly string[]
      readonly reason: string
    }
  >
>

const productProfileIsDeeplyReadonly: ProductProfileIsDeeplyReadonly = true
void productProfileIsDeeplyReadonly

const product = (
  handle: AssistantProduct['handle'],
  availableForSale = true
): AssistantProduct => ({
  id: `gid://shopify/Product/${handle}`,
  handle,
  title: handle,
  href: `/produkter/${handle}`,
  image: null,
  price: { amount: '2490.00', currencyCode: 'NOK' },
  variants: [
    {
      id: `gid://shopify/ProductVariant/${handle}`,
      title: 'Standard',
      availableForSale,
      selectedOptions: []
    }
  ]
})

const products = [
  product('utekos-techdown'),
  product('utekos-dun'),
  product('utekos-mikrofiber'),
  product('comfyrobe')
]

test('removes unavailable products before ranking', () => {
  const recommendations = matchAssistantProducts({
    products: [
      product('utekos-techdown', false),
      product('comfyrobe')
    ],
    lastUserText: 'Jeg trenger noe til båten i regn.',
    intent: 'product_help',
    currentProductHandle: null
  })

  assert.deepEqual(
    recommendations.map(
      recommendation => recommendation.product.handle
    ),
    ['comfyrobe']
  )
})

test('returns at most three ranked recommendations with one primary result', () => {
  const recommendations = matchAssistantProducts({
    products,
    lastUserText:
      'Jeg trenger noe til båt, hytte, bobil og isbading med mest varme, lett vekt og regn.',
    intent: 'product_help',
    currentProductHandle: null
  })

  assert.equal(recommendations.length, 3)
  assert.deepEqual(
    recommendations.map(({ rank, isPrimary }) => ({
      rank,
      isPrimary
    })),
    [
      { rank: 1, isPrimary: true },
      { rank: 2, isPrimary: false },
      { rank: 3, isPrimary: false }
    ]
  )
})

test('returns no recommendation when every matching product is unavailable', () => {
  const recommendations = matchAssistantProducts({
    products: [product('utekos-techdown', false)],
    lastUserText: 'Jeg trenger noe til båt i fukt.',
    intent: 'product_help',
    currentProductHandle: null
  })

  assert.deepEqual(recommendations, [])
})

test('uses the current product only to break a score tie', () => {
  const tiedRecommendations = matchAssistantProducts({
    products,
    lastUserText: 'Jeg trenger noe til båt i regn.',
    intent: 'product_help',
    currentProductHandle: 'comfyrobe'
  })

  assert.equal(
    tiedRecommendations[0]?.product.handle,
    'comfyrobe'
  )

  const strongerNeedRecommendations = matchAssistantProducts({
    products,
    lastUserText: 'Jeg trenger mest varme per gram på hytta.',
    intent: 'product_help',
    currentProductHandle: 'utekos-techdown'
  })

  assert.equal(
    strongerNeedRecommendations[0]?.product.handle,
    'utekos-dun'
  )
})

test('keeps a stronger stated need ahead of the current product', () => {
  const recommendations = matchAssistantProducts({
    products,
    lastUserText: 'båt, regn og isbading',
    intent: 'product_help',
    currentProductHandle: 'utekos-techdown'
  })

  assert.equal(recommendations[0]?.product.handle, 'comfyrobe')
})

test('normalizes canonical Norwegian text and rejects substring cues', () => {
  const normalizedRecommendations = matchAssistantProducts({
    products,
    lastUserText: 'BÅT',
    intent: 'product_help',
    currentProductHandle: null
  })

  assert.equal(
    normalizedRecommendations[0]?.product.handle,
    'utekos-techdown'
  )
  assert.deepEqual(
    matchAssistantProducts({
      products,
      lastUserText: 'toalett og regnskap',
      intent: 'product_help',
      currentProductHandle: null
    }),
    []
  )
  assert.equal(assistantProductProfiles.length, 4)
})

const compoundCueCases = [
  ['hyttetur', 'utekos-dun'],
  ['båttur', 'utekos-techdown'],
  ['regnvær', 'comfyrobe'],
  ['hundeluftingen', 'comfyrobe']
] as const

for (const [text, handle] of compoundCueCases) {
  test(`matches the explicit Norwegian cue form ${text}`, () => {
    assert.equal(
      matchAssistantProducts({
        products,
        lastUserText: text,
        intent: 'product_help',
        currentProductHandle: null
      })[0]?.product.handle,
      handle
    )
  })
}

test('accepts flexible whitespace inside locked multi-word cues', () => {
  assert.equal(
    matchAssistantProducts({
      products,
      lastUserText: 'mest\tvarme\nper  gram',
      intent: 'product_help',
      currentProductHandle: null
    })[0]?.product.handle,
    'utekos-dun'
  )
})
