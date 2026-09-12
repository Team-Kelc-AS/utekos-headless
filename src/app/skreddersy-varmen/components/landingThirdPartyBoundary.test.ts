import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()

async function readSource(relativePath: string) {
  return readFile(join(repoRoot, relativePath), 'utf8')
}

const OSM_IMPORT =
  /from ['"]@\/components\/klarna\/components\/KlarnaOnSiteMessagingScript['"]/u
const PURCHASE_STATIC_IMPORT =
  /from ['"]\.\/PurchaseClientLanding['"]/u

test('ads LP heroes do not load Klarna OSM on first paint', async () => {
  const hero = await readSource(
    'src/app/skreddersy-varmen/components/Hero.tsx'
  )
  const legacyHero = await readSource(
    'src/app/skreddersy-varmen/variants/legacy/components/Hero.tsx'
  )

  for (const [label, source] of [
    ['current hero', hero],
    ['legacy hero', legacyHero]
  ] as const) {
    assert.doesNotMatch(
      source,
      OSM_IMPORT,
      `${label} must not import Klarna OSM`
    )
    assert.doesNotMatch(
      source,
      /KlarnaCreditPromotionAutoSize/,
      `${label} must not mount Klarna OSM placements`
    )
    assert.doesNotMatch(
      source,
      /LandingPurchaseSection|PurchaseClientLanding/,
      `${label} must not import the purchase island`
    )
  }
})

test('purchase client JS loads through an explicit dynamic import', async () => {
  const section = await readSource(
    'src/app/skreddersy-varmen/components/LandingPurchaseSection.tsx'
  )
  const deferred = await readSource(
    'src/app/skreddersy-varmen/components/DeferredPurchaseClientLanding.tsx'
  )
  const loader = await readSource(
    'src/app/skreddersy-varmen/components/loadPurchaseClientLanding.ts'
  )

  assert.doesNotMatch(section, PURCHASE_STATIC_IMPORT)
  assert.match(section, /DeferredPurchaseClientLanding/)
  assert.match(
    loader,
    /import\('\.\/PurchaseClientLanding'\)/u
  )
  assert.match(deferred, /loadPurchaseClientLanding/)
  assert.doesNotMatch(
    deferred,
    /from ['"]\.\/PurchaseClientLanding['"]/u
  )
})

test('purchase reporters stay behind dynamic import helpers', async () => {
  const purchaseClient = await readSource(
    'src/app/skreddersy-varmen/components/PurchaseClientLanding.tsx'
  )
  const purchaseLogic = await readSource(
    'src/app/skreddersy-varmen/components/useLandingPurchaseLogic..tsx'
  )
  const purchaseView = await readSource(
    'src/app/skreddersy-varmen/components/PurchaseClientViewLanding.tsx'
  )

  assert.doesNotMatch(
    purchaseClient,
    /from ['"]@\/lib\/analytics\/viewItemReporter['"]/u
  )
  assert.match(purchaseClient, /loadViewItemReporter/)
  assert.doesNotMatch(
    purchaseLogic,
    /from ['"]@\/lib\/analytics\/addToCartReporter['"]/u
  )
  assert.doesNotMatch(
    purchaseLogic,
    /from ['"]@\/lib\/analytics\/variantSelectReporter['"]/u
  )
  assert.match(purchaseLogic, /loadAddToCartReporter/)
  assert.match(purchaseLogic, /loadVariantSelectReporter/)
  assert.doesNotMatch(
    purchaseView,
    /from ['"]\.\/KlarnaLandingExpressCheckout['"]/u
  )
  assert.match(purchaseView, /KlarnaLandingExpressCheckout/)
})
