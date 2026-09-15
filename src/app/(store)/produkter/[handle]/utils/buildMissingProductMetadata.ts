import type { Metadata } from 'next'
import { SITE_URL } from './siteUrl'

export function buildMissingProductMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: 'Produkt ikke funnet',
    description: 'Dette produktet er dessverre ikke tilgjengelig.'
  }
}
