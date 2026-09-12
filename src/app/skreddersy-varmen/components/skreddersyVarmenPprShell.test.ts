import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()

async function readSource(relativePath: string) {
  return readFile(join(repoRoot, relativePath), 'utf8')
}

test('PPR fallback is the current landing page, not a full-page loader', async () => {
  const page = await readSource(
    'src/app/skreddersy-varmen/page.tsx'
  )

  assert.match(
    page,
    /fallback=\{staticPage\}/,
    'The Suspense fallback must be the static current page'
  )
  assert.match(
    page,
    /<SkreddersyVarmenPageRuntime/,
    'The static shell must render the current landing document'
  )
  assert.doesNotMatch(
    page,
    /Laster siden/,
    'The prerendered shell must not be the full-page loading fallback'
  )
  assert.doesNotMatch(
    page,
    /resolveSkreddersyVarmenLayoutAssignment|resolveSkreddersyVarmenCommerce|cookies\(/,
    'The page entry must not read cookies or commerce before painting the shell'
  )
})

test('cookie assignment only wraps variant choice, not the static hero tree', async () => {
  const experiment = await readSource(
    'src/app/skreddersy-varmen/components/SkreddersyVarmenExperiment.tsx'
  )
  const runtime = await readSource(
    'src/app/skreddersy-varmen/components/SkreddersyVarmenPageRuntime.tsx'
  )
  const document = await readSource(
    'src/app/skreddersy-varmen/SkreddersyVarmenDocument.mdx'
  )

  assert.match(
    experiment,
    /await resolveSkreddersyVarmenLayoutAssignment\(\)/,
    'Experiment assignment remains the cookie/Flags boundary'
  )
  assert.match(
    experiment,
    /case 'legacy':/,
    'Legacy remains an assigned-layout branch'
  )
  assert.match(
    experiment,
    /case 'current':/,
    'Current remains an assigned-layout branch'
  )
  assert.doesNotMatch(
    experiment,
    /resolveSkreddersyVarmenCommerce/,
    'Experiment assignment must not await Shopify before choosing a layout'
  )
  assert.doesNotMatch(
    runtime,
    /await |resolveSkreddersyVarmenCommerce/,
    'The current page body must stay synchronous and commerce-free'
  )
  assert.match(
    document,
    /<HeroTheatre content=\{props\.content\.hero\}/,
    'Hero theatre must render from static page content'
  )
  assert.doesNotMatch(
    document,
    /commerce=\{/,
    'The document must not wait on a commerce prop before rendering chrome'
  )
})

test('commerce streams behind local Suspense holes', async () => {
  const hero = await readSource(
    'src/app/skreddersy-varmen/components/Hero.tsx'
  )
  const heroCommerce = await readSource(
    'src/app/skreddersy-varmen/components/HeroCommerceStatus.tsx'
  )
  const slots = await readSource(
    'src/app/skreddersy-varmen/components/SkreddersyVarmenCommerceSlots.tsx'
  )
  const document = await readSource(
    'src/app/skreddersy-varmen/SkreddersyVarmenDocument.mdx'
  )
  const layout = await readSource(
    'src/app/skreddersy-varmen/layout.tsx'
  )

  assert.match(
    hero,
    /id=['"]hero-headline['"]/,
    'Hero headline stays in the sync hero tree'
  )
  assert.match(
    hero,
    /<picture/,
    'Art-directed hero image stays in the sync hero tree'
  )
  assert.match(hero, /HeroCommerceStatusSlot/)
  assert.doesNotMatch(hero, /resolveSkreddersyVarmenCommerce/)

  assert.match(
    heroCommerce,
    /<Suspense fallback=\{null\}>/,
    'Hero price/stock must not block the headline or image'
  )
  assert.match(
    slots,
    /<Suspense fallback=\{<StickyMobileAction \/>\}>/,
    'Sticky bar must stream price behind a light fallback'
  )
  assert.match(
    slots,
    /<Suspense fallback=\{<LandingPurchaseFallback \/>\}>/,
    'Purchase must stream behind the existing purchase fallback'
  )
  assert.match(document, /<LandingPurchaseSlot/)
  assert.match(document, /<StickyMobileActionSlot/)
  assert.match(
    layout,
    /<Suspense fallback=\{null\}>/,
    'JSON-LD remains a streamed hole'
  )
})

test('product cache keeps one Cache Components layer plus request dedupe', async () => {
  const viewModel = await readSource(
    'src/lib/products/commerce/getProductCommerceViewModel.ts'
  )
  const product = await readSource(
    'src/api/lib/products/getProduct.ts'
  )
  const resolver = await readSource(
    'src/app/skreddersy-varmen/data/resolveSkreddersyVarmenCommerce.ts'
  )

  assert.doesNotMatch(
    viewModel,
    /'use cache: remote'/,
    'The view-model mapper must not add a second Cache Components layer'
  )
  assert.doesNotMatch(viewModel, /cacheLife\(|cacheTag\(/)
  assert.match(
    product,
    /'use cache: remote'/,
    'Shopify product reads keep the Cache Components cache'
  )
  assert.match(
    resolver,
    /export const resolveSkreddersyVarmenCommerce = cache\(/,
    'Landing commerce still dedupes within a request'
  )
})
