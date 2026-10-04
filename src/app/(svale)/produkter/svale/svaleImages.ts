import type { ProductLandingGalleryImage } from '@/app/(techdown)/produkter/techdown/techdownImages'

const SVALE_IMAGE_WIDTH = 1000
const SVALE_IMAGE_HEIGHT = 1500

function image(
  id: number,
  alt: string
): ProductLandingGalleryImage {
  const src = `/Svale_${id}.webp`

  return {
    id,
    main: src,
    thumbnail: src,
    width: SVALE_IMAGE_WIDTH,
    height: SVALE_IMAGE_HEIGHT,
    alt
  }
}

export const svaleImages = [
  image(1, 'Utekos Svale vist forfra.'),
  image(2, 'Utekos Svale, produktdetalj.'),
  image(3, 'Utekos Svale i helfigur.'),
  image(4, 'Utekos Svale, detaljvisning.'),
  image(6, 'Utekos Svale, produktvisning.')
] as const satisfies readonly ProductLandingGalleryImage[]
