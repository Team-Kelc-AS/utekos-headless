import Image, { getImageProps } from 'next/image'

const PAY_ICONS_MOBILE =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/PayIconsMobile.webp?v=1784837536'

const PAY_ICONS_IPAD =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/PayIconsIpad.webp?v=1784837673'

const PAY_ICONS_DESKTOP =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/FooterPayIcons.webp?v=1784837537'

const ALT =
  'Betalingsmetoder: Klarna, Vipps, Visa og Mastercard'

const PAY_ICONS_WIDTH = 390
const PAY_ICONS_HEIGHT = 50

const PAY_ICONS_SIZES =
  '(min-width: 1024px) 1024px, 100vw'

function getPaymentIconsSrcSet(src: string) {
  const {
    props: { srcSet }
  } = getImageProps({
    src,
    alt: ALT,
    width: PAY_ICONS_WIDTH,
    height: PAY_ICONS_HEIGHT,
    sizes: PAY_ICONS_SIZES
  })

  return srcSet
}

export function PaymentMethods() {
  const desktopSrcSet = getPaymentIconsSrcSet(
    PAY_ICONS_DESKTOP
  )
  const tabletSrcSet = getPaymentIconsSrcSet(
    PAY_ICONS_IPAD
  )

  return (
    <div className='mt-12 border-t border-border pt-8'>
      <picture className='mx-auto block w-full max-w-5xl'>
        <source
          media='(min-width: 1024px)'
          srcSet={desktopSrcSet}
          sizes={PAY_ICONS_SIZES}
        />

        <source
          media='(min-width: 768px)'
          srcSet={tabletSrcSet}
          sizes={PAY_ICONS_SIZES}
        />

        <Image
          src={PAY_ICONS_MOBILE}
          alt={ALT}
          width={PAY_ICONS_WIDTH}
          height={PAY_ICONS_HEIGHT}
          sizes={PAY_ICONS_SIZES}
          className='mx-auto h-auto w-full max-w-5xl'
        />
      </picture>
    </div>
  )
}