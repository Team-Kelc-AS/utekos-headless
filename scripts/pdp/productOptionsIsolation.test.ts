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
  'fetchProductOptions is excluded from the critical PDP content path',
  async () => {
    const asyncProductContentSource =
      await readSource(
        'src/app/produkter/[handle]/components/AsyncProductContent.tsx'
      )

    assert.doesNotMatch(
      asyncProductContentSource,
      /fetchProductOptions/
    )

    assert.doesNotMatch(
      asyncProductContentSource,
      /UtekosProductOptions/
    )

    assert.doesNotMatch(
      asyncProductContentSource,
      /productOptions/
    )

    assert.doesNotMatch(
      asyncProductContentSource,
      /hasVariantSelectionError/
    )
  }
)

test(
  'product options are fetched only inside the dedicated async purchase component',
  async () => {
    const asyncPurchaseSource =
      await readSource(
        'src/app/produkter/[handle]/components/AsyncProductPurchaseIsland.tsx'
      )

    assert.match(
      asyncPurchaseSource,
      /fetchProductOptions/
    )

    assert.match(
      asyncPurchaseSource,
      /await fetchProductOptions/
    )

    assert.match(
      asyncPurchaseSource,
      /selectedVariantAvailableForSale:\s*selectedVariant\.availableForSale/
    )

    assert.match(
      asyncPurchaseSource,
      /hasVariantSelectionError/
    )

    assert.match(
      asyncPurchaseSource,
      /<ProductPurchaseIsland/
    )
  }
)

test(
  'purchase options render behind their own Suspense boundary',
  async () => {
    const productPageViewSource =
      await readSource(
        'src/app/produkter/[handle]/components/ProductPageView.tsx'
      )

    assert.match(
      productPageViewSource,
      /import \{ Suspense \} from 'react'/
    )

    const boundaryIndex =
      productPageViewSource.indexOf(
        '<Suspense'
      )

    const asyncPurchaseIndex =
      productPageViewSource.indexOf(
        '<AsyncProductPurchaseIsland'
      )

    assert.notEqual(
      asyncPurchaseIndex,
      -1,
      'AsyncProductPurchaseIsland must be rendered'
    )

    assert.notEqual(
      boundaryIndex,
      -1,
      'A Suspense boundary must exist'
    )

    assert.match(
      productPageViewSource,
      /ProductPurchaseIslandSkeleton/
    )
  }
)