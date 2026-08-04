// Path: types/media/Image.ts

import type { StaticImageData } from 'next/image'

export type Image = {
  id: string
  url: string | StaticImageData
  altText: string
  width: number
  height: number
}
