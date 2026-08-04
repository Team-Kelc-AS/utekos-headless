import type { StaticImageData } from 'next/image'

export function resolveImageSrc(
  image: string | StaticImageData
): string {
  return typeof image === 'string' ? image : image.src
}
