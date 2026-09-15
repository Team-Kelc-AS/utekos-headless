import { AnimatedBlock } from '@/components/AnimatedBlock'
import { UtekosBreadcrumbBar } from '@/components/navigation/UtekosBreadcrumbBar'

export function DesktopBreadcrump({
  productTitle
}: {
  productTitle: string
  handle: string
}) {
  return (
    <AnimatedBlock
      className='will-animate-fade-in-up hidden md:block'
      delay='0s'
      threshold={0.2}
    >
      <UtekosBreadcrumbBar
        embedded
        surface='transparent'
        className='mb-8'
        items={[
          { label: 'Forside', href: '/' },
          { label: 'Produkter', href: '/produkter' },
          { label: productTitle }
        ]}
      />
    </AnimatedBlock>
  )
}
