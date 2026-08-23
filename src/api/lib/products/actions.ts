// Path: src/api/lib/products/actions.ts
'use server'

import { getProducts } from './getProducts'
import { getProduct } from './getProduct'
import { getFeaturedProducts } from './getFeaturedProducts'
import type { GetProductsParams } from '@types'

export async function getProductsAction(params: GetProductsParams = {}) {
  return await getProducts(params)
}

export async function getProductAction(handle: string) {
  return await getProduct(handle)
}

export async function getFeaturedProductsAction() {
  return getFeaturedProducts()
}
