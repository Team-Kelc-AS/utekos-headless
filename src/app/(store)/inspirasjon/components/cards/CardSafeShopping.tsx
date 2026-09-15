import Image from 'next/image'
import KlarnaBanner from '@/assets/images/partners/Klarna-1366x768.png'
import { Card } from '@/components/ui/card'
import { socialProofCardClassName } from './socialProofCardClassName'

export function CardSafeShopping() {
  return (
    <Card size='sm' className={socialProofCardClassName()}>
      <Image
        src={KlarnaBanner}
        alt='Klarna'
        fill
        sizes='(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 384px'
        className='object-cover object-center'
      />
    </Card>
  )
}
