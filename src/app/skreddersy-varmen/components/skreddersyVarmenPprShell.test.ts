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
  const loading = await readSource(
    'src/app/skreddersy-varmen/loading.tsx'
  )

  assert.match(
    page,
    /<SkreddersyVarmenPageRuntime content=\{content\} \/>/,
    'The current landing document must render in the static page tree'
  )
  assert.match(
    page,
    /<Suspense fallback=\{null\}>[\s\S]*<SkreddersyVarmenExperiment/,
    'Cookie assignment must be a sibling hole, not the page body'
  )
  assert.doesNotMatch(
    page,
    /searchParams/,
    'The page entry must not take searchParams or the root loading UI becomes the shell'
  )
  assert.match(
    loading,
    /<SkreddersyVarmenPageRuntime content=\{content\} \/>/,
    'Client navigations must keep the current landing document, not app/loading.tsx'
  )
  assert.doesNotMatch(
    page,
    /Laster siden/,
    'The prerendered shell must not be the full-page loading fallback'
  )
  assert.doesNotMatch(
    loading,
    /Laster siden|RouteLoadingState/,
    'The route loading UI must not reuse the generic skeleton loader'
  )
  assert.doesNotMatch(
    page,
    /resolveSkreddersyVarmenLayoutAssignment|resolveSkreddersyVarmenCommerce|cookies\(/,
    'The page entry must not read cookies or commerce before painting the shell'
  )
  assert.doesNotMatch(
    loading,
    /searchParams|cookies\(|resolveSkreddersyVarmen/,
    'The route loading shell must stay free of request data'
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
    /from ['"]\.\/SkreddersyVarmenPageRuntime['"]|SkreddersyVarmenDocument/,
    'The current page must not wait on experiment assignment'
  )
  assert.doesNotMatch(
    experiment,
    /resolveSkreddersyVarmenCommerce/,
    'Experiment assignment must not await Shopify before choosing a layout'
  )
  assert.doesNotMatch(
    runtime,
    /await |resolveSkreddersyVarmenCommerce|searchParams/,
    'The current page body must stay synchronous and request-free'
  )
  assert.match(
    document,
    /<HeroTheatre content=\{props\.content\.hero\}/,
    'Hero theatre must render from static page content'
  )
  assert.doesNotMatch(
    document,
    /commerce=\{|searchParams/,
    'The document must not wait on commerce or search params before rendering chrome'
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
