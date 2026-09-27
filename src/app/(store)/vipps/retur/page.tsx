import type { Metadata } from 'next'
import { VippsReturn } from '@/components/vipps/VippsReturn'

export const metadata: Metadata = {
  title: 'Vipps-betaling | Utekos',
  robots: { index: false, follow: false },
  referrer: 'no-referrer'
}
export default function VippsReturnPage() {
  return <VippsReturn />
}
