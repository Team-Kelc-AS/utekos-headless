'use client'

import { TechdownGallery } from '@/app/(techdown)/produkter/techdown/TechdownGallery'
import { svaleImages } from './svaleImages'

export function SvaleGallery() {
  return (
    <TechdownGallery
      galleryId='svale-gallery-slides'
      imageAspectRatio={2 / 3}
      images={svaleImages}
      productName='Utekos Svale'
    />
  )
}
