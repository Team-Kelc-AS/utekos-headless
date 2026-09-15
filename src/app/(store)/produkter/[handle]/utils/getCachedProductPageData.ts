import { getProduct } from '@/api/lib/products/getProduct'
import { requireProductPresentation } from '@/lib/products/presentation'

export async function getCachedProductPageData(handle: string) {
  const presentation = requireProductPresentation(handle)

  const product = await getProduct(presentation.publicHandle)

  return { product }
}
