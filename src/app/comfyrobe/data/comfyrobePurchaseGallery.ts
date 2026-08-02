export type ComfyrobePurchaseGallerySlide = {
  id: string
  alt: string
  /** 4:5 crop for phones (< 51rem). */
  mobileSrc: string
  /** Portrait crop for iPad / mid widths (51rem–85rem). */
  ipadSrc: string
  /** Square crop for large screens (> 85rem). */
  desktopSrc: string
  /** How the image should fill the slide frame. */
  fit?: 'cover' | 'contain'
}

export const COMFYROBE_PURCHASE_PRIMARY_IMAGE =
  '/comfy-ute-firkantet.webp'

export const COMFYROBE_PURCHASE_GALLERY: readonly ComfyrobePurchaseGallerySlide[] =
  [
    {
      id: 'mann',
      alt: 'Mann med Comfyrobe™ i studio',
      mobileSrc: '/comfy-mann-45.webp',
      ipadSrc: '/comfy-mann-ipad.webp',
      desktopSrc: '/comfy-mann-1024x1024.webp'
    },
    {
      id: 'kvinne',
      alt: 'Kvinne med Comfyrobe™ i studio',
      mobileSrc: '/comfy-kvinne-45.webp',
      ipadSrc: '/comfy-kvinne-ipad.webp',
      desktopSrc: '/comfy-kvinne-1024x1024.webp'
    },
    {
      id: 'produkt',
      alt: 'Comfyrobe™ forfra med SherpaCore™-hette',
      mobileSrc: '/comfy-45.webp',
      ipadSrc: '/comfy--ipad.webp',
      desktopSrc: '/comfy--1024x1024.webp'
    },
    {
      id: 'bak',
      alt: 'Comfyrobe™ ute og bakfra',
      mobileSrc: '/comfy-bak-45.webp',
      ipadSrc: '/comfy-bak-ipad.webp',
      desktopSrc: '/comfy-ute-firkantet.webp'
    }
  ] as const
