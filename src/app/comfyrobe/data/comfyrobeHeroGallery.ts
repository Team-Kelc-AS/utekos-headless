import type { StaticImageData } from 'next/image'
import comfyrobeBigMale from '@/assets/images/comfyrobe/Comfyrobe-Big-Male-1080x1350.webp'
import comfyMann45 from '@/assets/images/comfyrobe/comfy-mann-45.webp'

export type ComfyrobeHeroGallerySlide = {
  id: string
  alt: string
  src: StaticImageData
}

export const COMFYROBE_HERO_GALLERY: readonly ComfyrobeHeroGallerySlide[] =
  [
    {
      id: 'big-male',
      alt: 'Mann i mørk Comfyrobe, helfigur utendørs',
      src: comfyrobeBigMale
    },
    {
      id: 'mann-45',
      alt: 'Mann med mørk Comfyrobe fra Utekos',
      src: comfyMann45
    }
  ]
