import type { StaticImageData } from 'next/image'
import type { Image } from 'types/media'

export function productImage(
  id: string,
  url: string | StaticImageData,
  altText: string,
  width: number,
  height: number
): Image {
  return {
    id,
    url,
    altText,
    width,
    height
  }
}
