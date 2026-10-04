import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import styles from '@/app/(techdown)/produkter/techdown/techdown.module.css'
import { TechdownDeferredSiteChrome } from '@/app/(techdown)/produkter/techdown/TechdownDeferredSiteChrome'
import { generateProductMetadata } from '@/app/(store)/produkter/[handle]/utils/generateProductMetadata'
import { isProductPageRequestAllowed } from '@/lib/products/presentation'
import { SvaleContent } from './SvaleContent'
import { SvaleGallery } from './SvaleGallery'

export async function generateMetadata(): Promise<Metadata> {
  return generateProductMetadata('utekos-svale')
}

export default function SvalePage() {
  if (
    !isProductPageRequestAllowed(
      'utekos-svale',
      process.env.NODE_ENV
    )
  ) {
    notFound()
  }

  return (
    <main className={styles.canvas}>
      <h1 className='sr-only'>Utekos Svale</h1>
      <SvaleGallery />
      <SvaleContent />
      <TechdownDeferredSiteChrome />
    </main>
  )
}
