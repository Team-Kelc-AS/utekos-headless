import type { StaticImageData } from 'next/image'
import comfyrobeLake from '@/assets/images/comfyrobe/Comfyrobe-Lake-2000x2000.webp'
import comfyrobeOgBg from '@/assets/images/comfyrobe/Comfyrobe-OG-BG-2000x2000.webp'
import comfyrobeSherpaColoredBg from '@/assets/images/comfyrobe/Comfyrobe-Sherpa-Colord-BG-1440x2160.webp'
import comfyrobeXlFrontColoredBg from '@/assets/images/comfyrobe/Comfyrobe-XL-Front-Colored-Bg-1440x2160.webp'
import comfyrobeXlFrontOpen from '@/assets/images/comfyrobe/Comfyrobe-XL-Front-Open-2000x-2000.webp'
import comfyrobeXlFront1 from '@/assets/images/comfyrobe/Comfyrobe-XL-Front1-2000x-2000.webp'
import comfyrobeXlLogo2 from '@/assets/images/comfyrobe/Comfyrobe-XL-Logo-1440x2160-2.webp'

export type ComfyrobeHeroGallerySlide = {
  id: string
  alt: string
  src: StaticImageData
}

export const COMFYROBE_HERO_MOBILE_GALLERY: readonly ComfyrobeHeroGallerySlide[] =
  [
    {
      id: 'xl-logo-2',
      alt: 'Comfyrobe™ XL med logo',
      src: comfyrobeXlLogo2
    },
    {
      id: 'xl-front-colored-bg',
      alt: 'Comfyrobe™ XL forfra mot farget bakgrunn',
      src: comfyrobeXlFrontColoredBg
    }
  ]

export const COMFYROBE_HERO_TABLET_GALLERY: readonly ComfyrobeHeroGallerySlide[] =
  [
    {
      id: 'lake',
      alt: 'Mann i Comfyrobe™ ved innsjø og bobil',
      src: comfyrobeLake
    },
    {
      id: 'xl-front-1',
      alt: 'Comfyrobe™ XL forfra mot trevegg',
      src: comfyrobeXlFront1
    },
    {
      id: 'xl-front-open',
      alt: 'Comfyrobe™ XL forfra med synlig SherpaCore™-hette',
      src: comfyrobeXlFrontOpen
    },
    {
      id: 'og-bg',
      alt: 'Comfyrobe™ XL forfra, bakfra og med SherpaCore™-detalj',
      src: comfyrobeOgBg
    },
    {
      id: 'sherpa-colored-bg',
      alt: 'SherpaCore™-fôr mot mørk bakgrunn',
      src: comfyrobeSherpaColoredBg
    }
  ]
