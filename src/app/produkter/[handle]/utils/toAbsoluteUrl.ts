// Path: src/app/produkter/[handle]/utils/toAbsoluteUrl.ts
import type { StaticImageData } from 'next/image'
import { resolveImageSrc } from '@/lib/media/resolveImageSrc'
import { SITE_URL } from './siteUrl'

export function toAbsoluteUrl(url: string | StaticImageData) {
  const path = resolveImageSrc(url)

  try {
    return new URL(path).toString()
  } catch {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return new URL(normalizedPath, SITE_URL).toString()
  }
}
