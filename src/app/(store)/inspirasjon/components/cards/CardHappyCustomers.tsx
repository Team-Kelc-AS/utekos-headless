import Image from 'next/image'
import MarketingVmDark from '@/assets/images/partners/Marketing-VMP_Dark.svg'
import { Card } from '@/components/ui/card'
import { socialProofCardClassName } from './socialProofCardClassName'

export function CardHappyCustomers() {
  return (
    <Card size='sm' className={socialProofCardClassName()}>
      <Image
        src={MarketingVmDark}
        alt='Vipps'
        fill
        sizes='(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 384px'
        className='object-cover object-center'
      />
    </Card>
  )
}
