import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = process.cwd()

async function readSource(
  relativePath: string
): Promise<string> {
  return readFile(
    join(repoRoot, relativePath),
    'utf8'
  )
}

test(
  'related products are excluded from the critical PDP data path',
  async () => {
    const [
      cachedProductPageDataSource,
      asyncProductContentSource
    ] = await Promise.all([
      readSource(
        'src/app/produkter/[handle]/utils/getCachedProductPageData.ts'
      ),
      readSource(
        'src/app/produkter/[handle]/components/AsyncProductContent.tsx'
      )
    ])

    assert.doesNotMatch(
      cachedProductPageDataSource,
      /getCachedRelatedProducts/
    )

    assert.doesNotMatch(
      cachedProductPageDataSource,
      /relatedProducts/
    )

    assert.doesNotMatch(
      asyncProductContentSource,
      /getCachedRelatedProducts/
    )

    assert.doesNotMatch(
      asyncProductContentSource,
      /relatedProducts/
    )
  }
)

test(
  'related products render behind a dedicated lower-page Suspense boundary',
  async () => {
    const [
      productPageViewSource,
      asyncRelatedProductsSource
    ] = await Promise.all([
      readSource(
        'src/app/produkter/[handle]/components/ProductPageView.tsx'
      ),
      readSource(
        'src/app/produkter/[handle]/components/AsyncRelatedProducts.tsx'
      )
    ])

    assert.match(
      productPageViewSource,
      /import \{ Suspense \} from 'react'/
    )

    assert.match(
      productPageViewSource,
      /AsyncRelatedProducts/
    )

    assert.match(
      asyncRelatedProductsSource,
      /getCachedRelatedProducts/
    )

    assert.match(
      asyncRelatedProductsSource,
      /try \{/
    )

    assert.match(
      asyncRelatedProductsSource,
      /return null/
    )

    assert.doesNotMatch(
      asyncRelatedProductsSource,
      /buildProductCardModel/
    )

    assert.match(
      asyncRelatedProductsSource,
      /<RelatedProducts/
    )

    const accordionIndex =
      productPageViewSource.indexOf(
        '<ProductPageAccordion'
      )

    const recommendationsIndex =
      productPageViewSource.indexOf(
        '<AsyncRelatedProducts'
      )

    assert.notEqual(
      accordionIndex,
      -1,
      'ProductPageAccordion must exist'
    )

    assert.notEqual(
      recommendationsIndex,
      -1,
      'AsyncRelatedProducts must exist'
    )

    assert.ok(
      recommendationsIndex > accordionIndex,
      'Recommendations must remain below the product accordion'
    )
  }
)

test(
  'related products use a dedicated product-card query instead of the full product fragment',
  async () => {
    const [
      querySource,
      cachedRelatedSource
    ] = await Promise.all([
      readSource(
        'src/api/graphql/queries/products/getProductCardsQuery.ts'
      ),
      readSource(
        'src/api/lib/products/getCachedRelatedProducts.ts'
      )
    ])

    assert.match(querySource, /query getProductCards/)
    assert.doesNotMatch(querySource, /productFragment/)
    assert.doesNotMatch(querySource, /VariantHandler/)
    assert.doesNotMatch(querySource, /compareAtPriceRange/)
    assert.doesNotMatch(cachedRelatedSource, /fetchProducts/)
    assert.doesNotMatch(cachedRelatedSource, /getProductsQuery/)
    assert.match(cachedRelatedSource, /loadRelatedProducts/)
  }
)

test(
  'product catalog webhooks expire related-products Runtime Cache tags',
  async () => {
    const source = await readSource(
      'src/lib/cache/revalidateProductCatalog.ts'
    )

    assert.match(source, /related-products/)
    assert.match(source, /related-products-handle:\$\{normalizedHandle\}/)
    assert.match(source, /runtimeCache\.expireTag/)
  }
)