'use client'

import { useEffect, type ReactNode } from 'react'
import { StickyCTAEntranceContext } from '@/components/commerce/StickyCTA/StickyCTAEntranceContext'
import { EnsureCartProviders } from '@/components/providers/Providers'
import { StickyCTASelectionProvider } from '@/components/commerce/StickyCTA/StickyCTASelectionContext'
import { TechdownHeader } from '@/app/(techdown)/produkter/techdown/TechdownHeader'
import styles from '@/app/(techdown)/produkter/techdown/techdown.module.css'
import { SvaleMobileOnly } from './SvaleMobileOnly'
import './svale.module.css'

export function SvaleIntro({
  children,
  mobileContent
}: {
  children: ReactNode
  mobileContent: ReactNode
}) {
  useEffect(() => {
    document.body.dataset.svaleCart = 'true'
    return () => {
      delete document.body.dataset.svaleCart
    }
  }, [])

  return (
    <StickyCTASelectionProvider>
      <StickyCTAEntranceContext value={true}>
        <EnsureCartProviders>
          <div id='svale-stage' className={styles.mobilePage}>
            <TechdownHeader />
            {children}
          </div>
          <SvaleMobileOnly>{mobileContent}</SvaleMobileOnly>
        </EnsureCartProviders>
        <div
          id='svale-intro'
          className={styles.intro}
          aria-hidden='true'
        />
      </StickyCTAEntranceContext>
    </StickyCTASelectionProvider>
  )
}
