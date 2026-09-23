import { Suspense } from 'react'
import Link from 'next/link'
import { unstable_rethrow } from 'next/navigation'
import { getProductModel } from '@/lib/products/commerce/getProductModel'
import { StickyCTAClient } from './StickyCTAClient'
import { StickyCTASurface } from './StickyCTASurface'
import { createTechdownPurchaseData } from './techdownPurchaseData'
import styles from './StickyCTA.module.css'

async function TechdownStickyCTA() {
  let purchase: ReturnType<typeof createTechdownPurchaseData> | null =
    null

  try {
    const product = await getProductModel('utekos-techdown')
    if (product) purchase = createTechdownPurchaseData(product)
  } catch (error) {
    unstable_rethrow(error)
    return (
      <StickyCTASurface>
        <div className={styles.fallback} role='status'>
          <p>Produktene kunne ikke lastes.</p>
          <Link href='/produkter'>Se produktene</Link>
        </div>
      </StickyCTASurface>
    )
  }

  return purchase ? <StickyCTAClient purchase={purchase} /> : null
}

/** TechDown mobile purchase summary. Full commerce data stays in the purchase island. */
export function StickyCTA() {
  return (
    <Suspense
      fallback={
        <StickyCTASurface busy>
          <div className={styles.fallback} role='status'>
            Laster produkter…
          </div>
        </StickyCTASurface>
      }
    >
      <TechdownStickyCTA />
    </Suspense>
  )
}
