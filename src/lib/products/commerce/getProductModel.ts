import 'server-only'
import { getProduct } from '@/api/lib/products/getProduct'
import { requireProductPresentation } from '@/lib/products/presentation'
import { buildProductModel } from './buildProductModel'

export async function getProductModel(publicHandle: string) {
  const presentation = requireProductPresentation(publicHandle)
  const product = await getProduct(presentation.publicHandle)
  return product ? buildProductModel(product) : null
}
