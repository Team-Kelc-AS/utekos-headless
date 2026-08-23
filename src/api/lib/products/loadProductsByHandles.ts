import type { ShopifyProduct } from 'types/product'

export async function loadProductsByHandles(
  handles: readonly string[],
  loadProduct: (handle: string) => Promise<ShopifyProduct | null>
): Promise<ShopifyProduct[]> {
  const products = await Promise.all(
    handles.map(handle => loadProduct(handle))
  )

  return products.filter((product): product is ShopifyProduct =>
    Boolean(product)
  )
}
