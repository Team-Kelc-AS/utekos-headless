'use client'

import { useEffect, type ReactNode } from 'react'
import styles from './techdown.module.css'
import { StickyCTAEntranceContext } from '@/components/commerce/StickyCTA/StickyCTAEntranceContext'
import { TechdownHeader } from './TechdownHeader'
import { TechdownMobileOnly } from '../../TechdownMobileOnly'
import { EnsureCartProviders } from '@/components/providers/Providers'
import { StickyCTASelectionProvider } from '@/components/commerce/StickyCTA/StickyCTASelectionContext'

export function TechdownIntro({
  children,
  mobileContent
}: {
  children: ReactNode
  mobileContent: ReactNode
}) {
  useEffect(() => {
    document.body.dataset.techdownCart = 'true'
    return () => {
      delete document.body.dataset.techdownCart
    }
  }, [])

  return (
    <StickyCTASelectionProvider>
      <StickyCTAEntranceContext value={true}>
        <EnsureCartProviders>
          <div id='techdown-stage' className={styles.mobilePage}>
            <TechdownHeader />
            {children}
          </div>
          <TechdownMobileOnly>{mobileContent}</TechdownMobileOnly>
        </EnsureCartProviders>
        <div
          id='techdown-intro'
          className={styles.intro}
          aria-hidden='true'
        />
      </StickyCTAEntranceContext>
    </StickyCTASelectionProvider>
  )
}
