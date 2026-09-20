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

test('Klarna OSM is primed before purchase without shifting it', async () => {
  const deferred = await readSource(
    'src/app/skreddersy-varmen/components/DeferredKlarnaOnSiteMessaging.tsx'
  )
  const strip = await readSource(
    'src/app/skreddersy-varmen/components/SkreddersyVarmenKlarnaStrip.tsx'
  )

  assert.match(deferred, /DEFAULT_ROOT_MARGIN = '4000px 0px'/u)
  assert.match(
    deferred,
    /KlarnaOnSiteMessagingScript strategy='afterInteractive'/u
  )
  assert.doesNotMatch(deferred, /strategy='lazyOnload'/u)
  assert.match(strip, /min-h-\[2\.625rem\]/u)
})

test('purchase client JS loads through an explicit dynamic import', async () => {
  const section = await readSource(
    'src/app/skreddersy-varmen/components/LandingPurchaseSection.tsx'
  )
  const deferred = await readSource(
    'src/app/skreddersy-varmen/components/DeferredPurchaseClientLanding.tsx'
  )
  const fallback = await readSource(
    'src/app/skreddersy-varmen/components/LandingPurchaseFallback.tsx'
  )

  assert.doesNotMatch(section, PURCHASE_STATIC_IMPORT)
  assert.match(section, /DeferredPurchaseClientLanding/)
  assert.match(section, /commerce=\{commerce\}/u)
  assert.match(section, /requireProductPresentation/u)
  assert.match(
    deferred,
    /import\('\.\/LandingPurchaseRuntime'\)/
  )
  assert.doesNotMatch(deferred, /getLandingPurchaseData/u)
  assert.doesNotMatch(deferred, /IntersectionObserver/u)
  assert.doesNotMatch(deferred, /ssr:\s*false/u)
  assert.match(deferred, /utekos:landing:cart/u)
  assert.match(fallback, /aria-busy='true'/u)
  assert.doesNotMatch(fallback, /Siden er klar/u)
  assert.doesNotMatch(fallback, /Åpne produktet/u)
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
