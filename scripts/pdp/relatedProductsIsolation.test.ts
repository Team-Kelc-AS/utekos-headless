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