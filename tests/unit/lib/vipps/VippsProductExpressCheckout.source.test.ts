import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const source = readFileSync(
  new URL(
    '../../../../src/components/vipps/VippsProductExpressCheckout.tsx',
    import.meta.url
  ),
  'utf8'
)
const buttonSource = readFileSync(
  new URL('../../../../src/components/vipps/vippsWidget.ts', import.meta.url),
  'utf8'
)
const featuredSource = readFileSync(
  new URL(
    '../../../../src/components/frontpage/FeaturedProductSection.tsx',
    import.meta.url
  ),
  'utf8'
)

test('ProductCard opens the purchase review with the Vipps button', () => {
  assert.match(source, /mountVippsButton/u)
  assert.match(source, /action=\{\{\s*click:/u)
  assert.doesNotMatch(source, />\s*Sjekk kjøpet\s*</u)
})

test('Vipps button uses the supported library and redirects to the payment URL', () => {
  assert.match(buttonSource, /cdn\.vippsmobilepay\.com\/js\/button\/button\.js/u)
  assert.match(buttonSource, /vipps-mobilepay-button/u)
  assert.match(buttonSource, /window\.location\.assign\(result\.redirectUrl\)/u)
  assert.doesNotMatch(buttonSource, /widget-sdk|widget-button/u)
  assert.doesNotMatch(featuredSource, /showExpressCheckout=\{false\}/u)
})

test('purchase review uses the requested TechDown copy', () => {
  assert.match(source, />\s*Utekos TechDown™\s*</u)
  assert.doesNotMatch(
    source,
    /Se at produkt, farge og størrelse stemmer/u
  )
  assert.doesNotMatch(source, /Dette kjøper du/u)
})
