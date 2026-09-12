import { getProduct } from '@/api/lib/products/getProduct'
import { PurchaseSectionClient } from './PurchaseSectionClient'

export async function PurchaseSection() {
  const product = await getProduct('utekos-mikrofiber')

  return <PurchaseSectionClient product={product ?? null} />
}
