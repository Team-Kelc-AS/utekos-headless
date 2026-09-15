import Image from 'next/image'
import PostNordBanner from '@/assets/images/partners/Postnord-1920-1080.png'
import { Card } from '@/components/ui/card'
import { socialProofCardClassName } from './socialProofCardClassName'

interface CardFastDeliveryProps {
  className?: string
}

export function CardFastDelivery({
  className
}: CardFastDeliveryProps) {
  return (
    <Card size='sm' className={socialProofCardClassName(className)}>
      <Image
        src={PostNordBanner}
        alt='PostNord'
        fill
        sizes='(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 384px'
        className='object-cover object-center'
      />
    </Card>
  )
}
