'use client'

import UtekosWordmark from '@/components/BrandComponents/utils/UtekosWordmark'
import { PreFooterNavigation } from '@/app/skreddersy-varmen/components/PreFooterNavigation'
import Footer from '@/components/footer/components/Footer'
import { Toaster } from '@/components/ui/sonner'
import styles from './TechdownContent.module.css'

/** Full site chrome pulled in only after the deferred gate opens. */
export function TechdownSiteChrome() {
  return (
    <div className={styles.siteChrome}>
      <PreFooterNavigation
        title={
          <span className='flex items-baseline gap-3'>
            <span>
              Mer <span className='sr-only'>Utekos</span>
            </span>
            <UtekosWordmark
              aria-hidden
              className='h-[0.72em] w-auto translate-y-[0.04em] text-foreground'
            />
          </span>
        }
      />
      <Footer />
      <Toaster richColors position='bottom-center' />
    </div>
  )
}
