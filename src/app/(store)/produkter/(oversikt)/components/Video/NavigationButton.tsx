import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import type { Route } from 'next'

export function NavigationButton() {
  return (
    <div className='animate-header-item mt-12 w-full'>
      <Button
        variant='default'
        size='default'
        className='mb-2 w-full rounded-2xl bg-primary px-8 py-8 text-lg leading-none tracking-[-0.01em] text-foreground hover:scale-103 hover:bg-primary/90'
        asChild
      >
        <Link
          href={'/produkter/utekos-mikrofiber' as Route}
          data-track='ProductVideoSectionShopNowClick'
        >
          Opplev Utekos
          <ArrowRight className='transition-transform duration-200 group-hover:translate-x-0.5' />
        </Link>
      </Button>
    </div>
  )
}
