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

test('ProductCard opens the purchase review with the official Vipps SDK button', () => {
  assert.match(source, /mountVippsButton/u)
  assert.match(source, /action=\{\{\s*click:/u)
  assert.doesNotMatch(source, />\s*Sjekk kjøpet\s*</u)
})

test('purchase review uses the requested TechDown copy', () => {
  assert.match(source, />\s*Utekos TechDown™\s*</u)
  assert.doesNotMatch(
    source,
    /Se at produkt, farge og størrelse stemmer/u
  )
  assert.doesNotMatch(source, /Dette kjøper du/u)
})
