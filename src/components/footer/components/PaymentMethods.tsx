const PAY_ICONS_MOBILE =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/PayIconsMobile.webp?v=1784837536'
const PAY_ICONS_IPAD =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/PayIconsIpad.webp?v=1784837673'
const PAY_ICONS_DESKTOP =
  'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/FooterPayIcons.webp?v=1784837537'

const ALT =
  'Betalingsmetoder: Klarna, Vipps, Visa og Mastercard'

export function PaymentMethods() {
  return (
    <div className='mt-12 border-t border-border pt-8'>
      <picture className='mx-auto block w-full max-w-5xl'>
        <source
          media='(min-width: 1024px)'
          srcSet={PAY_ICONS_DESKTOP}
        />
        <source
          media='(min-width: 768px)'
          srcSet={PAY_ICONS_IPAD}
        />
        <img
          src={PAY_ICONS_MOBILE}
          alt={ALT}
          width={390}
          height={50}
          className='mx-auto h-auto w-full max-w-5xl'
        />
      </picture>
    </div>
  )
}
