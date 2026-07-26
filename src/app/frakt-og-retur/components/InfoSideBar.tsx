import {
  BadgeCheck,
  Mail,
  Package,
  ShieldCheck
} from 'lucide-react'
import Link from 'next/link'

const guaranteeIconClassName =
  'flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'

export function InfoSidebar() {
  return (
    <aside className='w-full lg:col-span-4'>
      <div className='sticky top-28 flex min-w-0 flex-col rounded-2xl bg-muted/40 p-2'>
        <div className='flex flex-col items-start rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm ring-1 ring-border sm:p-8'>
          <h3 className='mb-8 text-left font-sans font-utekos-text-medium text-xl leading-tight text-card-foreground'>
            Dine trygghetsgarantier
          </h3>

          <ul className='flex w-full flex-col gap-6'>
            <li className='flex items-start gap-4'>
              <div className={guaranteeIconClassName}>
                <ShieldCheck
                  className='size-5'
                  strokeWidth={1.8}
                  aria-hidden='true'
                />
              </div>
              <div className='flex flex-col items-start'>
                <span className='font-sans font-utekos-text-medium text-base text-card-foreground'>
                  14 dagers angrerett
                </span>
                <span className='mt-1 text-left font-utekos-text text-sm leading-relaxed text-card-foreground/90'>
                  Lovfestet trygghet fra du mottar varen.
                </span>
              </div>
            </li>

            <li className='flex items-start gap-4'>
              <div className={guaranteeIconClassName}>
                <Package
                  className='size-5'
                  strokeWidth={1.8}
                  aria-hidden='true'
                />
              </div>
              <div className='flex flex-col items-start'>
                <span className='font-sans font-utekos-text-medium text-base text-card-foreground'>
                  Fri frakt over 999 kr
                </span>
                <span className='mt-1 text-left font-utekos-text text-sm leading-relaxed text-card-foreground/90'>
                  Vi spanderer frakten på større bestillinger.
                </span>
              </div>
            </li>

            <li className='flex items-start gap-4'>
              <div className={guaranteeIconClassName}>
                <BadgeCheck
                  className='size-5'
                  strokeWidth={1.8}
                  aria-hidden='true'
                />
              </div>
              <div className='flex flex-col items-start'>
                <span className='font-sans font-utekos-text-medium text-base text-card-foreground'>
                  Retur
                </span>
                <address className='mt-1 not-italic'>
                  <span className='text-left font-utekos-text text-sm leading-relaxed text-card-foreground/90'>
                    Send en e-post til kundeservice@utekos.no, så
                    er du i gang.
                  </span>
                </address>
              </div>
            </li>
          </ul>

          <hr className='my-8 w-full border-t border-border' />

          <div className='flex w-full flex-col items-start'>
            <h4 className='mb-4 text-left font-sans font-utekos-text-medium text-base text-card-foreground'>
              Har du andre spørsmål?
            </h4>
            <Link
              href='/kontaktskjema'
              data-track='ShippingReturnsContactClick'
              className='font-google-sans flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-secondary/30 bg-secondary px-6 py-3 font-sans text-base font-bold text-secondary-foreground shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none'
            >
              <Mail className='size-5' aria-hidden='true' />
              Kontakt oss
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
