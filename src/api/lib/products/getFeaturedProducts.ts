'use cache'
import 'server-only'

import { handles } from '@/db/data/products/product-info'
import { getProduct } from './getProduct'
import { loadProductsByHandles } from './loadProductsByHandles'
import { cacheLife, cacheTag } from 'next/cache'

export async function getFeaturedProducts() {
  cacheLife('hours')
  cacheTag('products')

  return loadProductsByHandles(handles, getProduct)
}
