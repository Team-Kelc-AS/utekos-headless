import { CopyrightNotice } from '@/components/footer/components/CopyrightNotice'
import { FooterNavigation } from '@/components/footer/components/FooterNavigation'
import { PaymentMethods } from '@/components/footer/components/PaymentMethods'
import { ConditionalNewsLetter } from '@/components/footer/components/ConditionalNewsletter'

export default function Footer() {
  return (
    <footer className='mt-auto border-t border-border pt-12 pb-4 font-sans text-foreground'>
      <div className='container mx-auto px-4 sm:px-8'>
        <FooterNavigation />
        <ConditionalNewsLetter />
        <PaymentMethods />
        <CopyrightNotice />
      </div>
    </footer>
  )
}
