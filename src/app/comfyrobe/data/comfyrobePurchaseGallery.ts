import type { StaticImageData } from 'next/image'
import comfy1024x1024 from '@/assets/images/comfyrobe/comfy--1024x1024.webp'
import comfyIpad from '@/assets/images/comfyrobe/comfy--ipad.webp'
import comfy45 from '@/assets/images/comfyrobe/comfy-45.webp'
import comfyBak45 from '@/assets/images/comfyrobe/comfy-bak-45.webp'
import comfyBakIpad from '@/assets/images/comfyrobe/comfy-bak-ipad.webp'
import comfyKvinne1024x1024 from '@/assets/images/comfyrobe/comfy-kvinne-1024x1024.webp'
import comfyKvinne45 from '@/assets/images/comfyrobe/comfy-kvinne-45.webp'
import comfyKvinneIpad from '@/assets/images/comfyrobe/comfy-kvinne-ipad.webp'
import comfyMann1024x1024 from '@/assets/images/comfyrobe/comfy-mann-1024x1024.webp'
import comfyMann45 from '@/assets/images/comfyrobe/comfy-mann-45.webp'
import comfyMannIpad from '@/assets/images/comfyrobe/comfy-mann-ipad.webp'
import comfyUteFirkantet from '@/assets/images/comfyrobe/comfy-ute-firkantet.webp'

export type ComfyrobePurchaseGallerySlide = {
  id: string
  alt: string
  /** 4:5 crop for phones (< 51rem). */
  mobileSrc: StaticImageData
  /** Portrait crop for iPad / mid widths (51rem–85rem). */
  ipadSrc: StaticImageData
  /** Square crop for large screens (> 85rem). */
  desktopSrc: StaticImageData
  /** How the image should fill the slide frame. */
  fit?: 'cover' | 'contain'
}

export const COMFYROBE_PURCHASE_PRIMARY_IMAGE =
  comfyKvinne1024x1024

export const COMFYROBE_PURCHASE_GALLERY: readonly ComfyrobePurchaseGallerySlide[] =
  [
    {
      id: 'kvinne',
      alt: 'Kvinne med Comfyrobe™ i studio',
      mobileSrc: comfyKvinne45,
      ipadSrc: comfyKvinneIpad,
      desktopSrc: comfyKvinne1024x1024
    },
    {
      id: 'mann',
      alt: 'Mann med Comfyrobe™ i studio',
      mobileSrc: comfyMann45,
      ipadSrc: comfyMannIpad,
      desktopSrc: comfyMann1024x1024
    },
    {
      id: 'produkt',
      alt: 'Comfyrobe™ forfra med SherpaCore™-hette',
      mobileSrc: comfy45,
      ipadSrc: comfyIpad,
      desktopSrc: comfy1024x1024
    },
    {
      id: 'bak',
      alt: 'Comfyrobe™ ute og bakfra',
      mobileSrc: comfyBak45,
      ipadSrc: comfyBakIpad,
      desktopSrc: comfyUteFirkantet
    }
  ] as const
