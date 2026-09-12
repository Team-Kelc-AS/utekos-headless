import 'server-only'
import { getProduct } from '@/api/lib/products/getProduct'
import { COMFYROBE_PRODUCT_HANDLE } from '../data/comfyrobeLandingSeo'

export async function getComfyrobeLandingProduct() {
  return getProduct(COMFYROBE_PRODUCT_HANDLE)
}
