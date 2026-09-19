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

test('ads LP hero does not load Klarna OSM on first paint', async () => {
  const hero = await readSource(
    'src/app/skreddersy-varmen/components/Hero.tsx'
  )

  assert.doesNotMatch(
    hero,
    OSM_IMPORT,
    'hero must not import Klarna OSM'
  )
  assert.doesNotMatch(
    hero,
    /KlarnaCreditPromotionAutoSize/,
    'hero must not mount Klarna OSM placements'
  )
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
  assert.match(loader, /import\('\.\/PurchaseClientLanding'\)/u)
  assert.match(
    deferred,
    /import\('\.\/LandingPurchaseRuntime'\)/
  )
  assert.match(deferred, /IntersectionObserver/)
  assert.match(deferred, /utekos:landing:purchase/)
  const scrollHelper = await readSource(
    'src/app/skreddersy-varmen/components/scrollToLandingSize.ts'
  )
  const heroActions = await readSource(
    'src/app/skreddersy-varmen/components/HeroActions.tsx'
  )
  assert.match(
    heroActions,
    /purchase: 'purchase-section'/,
    'the unhydrated hero CTA must target the purchase shell that exists in the initial HTML'
  )
  assert.match(
    scrollHelper,
    /\[data-landing-size-ready\], #landing-size-selection, #purchase-section/,
    'the hero CTA must scroll to the loading placeholder so the deferred purchase island can enter the viewport and hydrate'
  )
  assert.doesNotMatch(
    deferred,
    /import\s+\{[^}]*PurchaseClientLanding[^}]*\}\s+from/u
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
