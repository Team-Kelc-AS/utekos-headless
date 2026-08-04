// src/app/magasinet/_utils/toAbsoluteUrl.ts
import type { StaticImageData } from 'next/image'
import { SITE_URL } from '@/constants'

export function toAbsoluteUrl(url: string | StaticImageData) {
  const path = typeof url === 'string' ? url : url.src

  try {
    return new URL(path).toString()
  } catch {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`

    return new URL(normalizedPath, SITE_URL).toString()
  }
}
