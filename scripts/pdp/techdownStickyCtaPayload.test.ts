import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()

async function readSource(relativePath: string): Promise<string> {
  return readFile(join(repoRoot, relativePath), 'utf8')
}

test('TechDown StickyCTA serializes only its purchase summary', async () => {
  const [serverSource, clientSource, dataSource, catalogSource, routeSource] = await Promise.all([
    readSource('src/components/commerce/StickyCTA/StickyCTA.tsx'),
    readSource('src/components/commerce/StickyCTA/StickyCTAClient.tsx'),
    readSource('src/components/commerce/StickyCTA/techdownPurchaseData.ts'),
    readSource('src/components/commerce/StickyCTA/StickyCTACatalogDialog.tsx'),
    readSource('src/app/api/commerce/sticky-catalog/route.ts')
  ])

  assert.match(
    serverSource,
    /getProductModel\('utekos-techdown'\)/,
    'The route must request only TechDown for the initial purchase bar'
  )
  assert.doesNotMatch(
    serverSource,
    /getAllProductPresentations/,
    'The initial purchase bar must not request the full presentation catalog'
  )
  assert.match(
    serverSource,
    /purchase = createTechdownPurchaseData\(product\)/,
    'Only the slim purchase DTO may cross the server-client boundary'
  )
  assert.doesNotMatch(
    clientSource,
    /KlarnaProductExpressCheckout|lucide-react|@\/components\/ui\/tooltip/,
    'Klarna SDK, catalog icons, and tooltip must not be part of the initial sticky CTA'
  )
  assert.match(
    clientSource,
    /anchor=\{triggerRef/,
    'Variant popover must anchor to the product trigger without baking Popover into the initial chunk'
  )
  assert.match(
    clientSource,
    /dynamic\([\s\S]*?StickyCTAKlarna[\s\S]*?ssr:\s*false/,
    'Klarna must stay client-only and load after idle'
  )
  assert.match(
    clientSource,
    /dynamic\([\s\S]*?StickyCTACatalogDialog[\s\S]*?ssr:\s*false/,
    'The variant dialog must remain client-only and code split'
  )
  assert.match(
    dataSource,
    /checkout:\s*\{/,
    'The DTO must carry the existing Klarna cart payload without a second product fetch'
  )
  assert.match(
    catalogSource,
    /createPortal/,
    'Variant list must portal above the sticky bar without Base UI Popover dismiss races'
  )
  assert.doesNotMatch(
    catalogSource,
    /@base-ui\/react\/popover/,
    'Variant list must not depend on Popover in the deferred catalog chunk'
  )
  assert.match(
    routeSource,
    /getAllProductPresentations/,
    'The full catalog may only be read by the deferred catalog route'
  )
  assert.match(
    dataSource,
    /productId: product\.id/,
    'The DTO must retain product identity'
  )
  assert.match(
    dataSource,
    /availableForSale: variant\.availableForSale/,
    'The DTO must retain variant availability'
  )
  assert.doesNotMatch(
    clientSource,
    /from ['"]@\/lib\/analytics\/selectItemReporter['"]/,
    'select_item must stay deferred so it does not inflate the sticky CTA chunk'
  )
  assert.doesNotMatch(
    clientSource,
    /from ['"]@\/lib\/analytics\/viewItemReporter['"]/,
    'view_item must stay deferred so it does not inflate the sticky CTA chunk'
  )
  assert.match(
    clientSource,
    /import\(['"]@\/lib\/analytics\/selectItemReporter['"]\)/,
    'Catalog variant picks must report select_item'
  )
  assert.match(
    clientSource,
    /import\(['"]@\/lib\/analytics\/viewItemReporter['"]\)/,
    'Catalog variant picks must report view_item'
  )
  assert.match(
    clientSource,
    /itemListId:\s*['"]sticky-cta-catalog['"]/,
    'Sticky catalog selections must use a dedicated item_list_id'
  )
})

test('Sonner loads only when an add-to-cart error needs a toast', async () => {
  const source = await readSource('src/hooks/useCanonicalAddToCart.ts')

  assert.doesNotMatch(
    source,
    /import\s*\{\s*toast\s*\}\s*from\s*['"]sonner['"]/,
    'Sonner must not be a static dependency of add-to-cart'
  )
  assert.match(
    source,
    /import\(['"]sonner['"]\)/,
    'Sonner must load only when an add-to-cart error occurs'
  )
})
