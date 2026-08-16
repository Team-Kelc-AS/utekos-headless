import type { ReactNode } from 'react'
import { ComfyrobeJsonLd } from './structured-data/ComfyrobeJsonLd'
import { getComfyrobeLandingProduct } from './lib/getComfyrobeLandingProduct'

export default async function ComfyrobeLandingLayout({
  children
}: {
  children: ReactNode
}) {
  const product = await getComfyrobeLandingProduct()

  return (
    <>
      {product ?
        <ComfyrobeJsonLd product={product} />
      : null}
      {children}
    </>
  )
}
