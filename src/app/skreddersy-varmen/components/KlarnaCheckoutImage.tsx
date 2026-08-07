import { cn } from '@/lib/utils/className'

const KLARNA_IMAGE_DESKTOP =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/728x90.png'
const KLARNA_IMAGE_TABLET =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/300x100_e8687c32-1f9f-4e0d-9562-af1d6ad0c939.png'
const KLARNA_IMAGE_MOBILE =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/320x50_0b8b051a-4eab-40b2-9a2c-0c610915afd4.png'

export function KlarnaCheckoutImage({ className }: { className?: string }) {
  return (
    <picture className={cn('block w-full min-w-0', className)}>
      <source
        media='(min-width: 900px)'
        srcSet={KLARNA_IMAGE_DESKTOP}
      />
      <source
        media='(min-width: 640px)'
        srcSet={KLARNA_IMAGE_TABLET}
      />
      <img
        src={KLARNA_IMAGE_MOBILE}
        alt='Velg Klarna i kassen'
        width={320}
        height={50}
        className='h-auto w-full max-w-80 min-[640px]:max-w-75 min-[900px]:max-w-none'
      />
    </picture>
  )
}
