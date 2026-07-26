import { BadgeCheckIcon } from '@/components/animate-icons/icons/badge-check'
import { CompassIcon } from '@/components/animate-icons/icons/compass'
import { UsersIcon } from '@/components/animate-icons/icons/users'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export function NbccBenefitSection() {
  return (
    <article className='dark:bg-dark-background bg-background px-4 pt-3 pb-20 sm:px-6 lg:px-8'>
      <div className='mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start'>
        <div data-nbcc-reveal data-nbcc-animate>
          <Badge
            variant='promo'
            className='rounded-md px-3 py-2'
          >
            Medlemsfordel for NBCC-medlemmer
          </Badge>
          <h2 className='mt-6 max-w-2xl font-utekos-text-medium text-3xl tracking-normal text-balance text-foreground sm:text-4xl'>
            En varm fordel for de lange utekveldene.
          </h2>
        </div>

        <div
          data-nbcc-reveal
          data-nbcc-animate
          className='grid gap-6 text-base text-foreground'
        >
          <p>
            Utekos er ikke laget for de bratteste fjelltoppene.
            Vi designer plagg for kompromissløs komfort. For de
            gangene du ikke skal bestige noe som helst, men bare
            vil bli sittende ute og nyte campinglivet litt til.
            Passer like godt ved bobilen som i forteltet eller på
            fastplassen.
          </p>
        </div>
      </div>

      <Separator className='mx-auto mt-14 max-w-7xl bg-white/10' />

      <div
        data-nbcc-reveal
        data-nbcc-animate
        className='mx-auto grid max-w-7xl gap-8 py-8 md:grid-cols-3'
      >
        <div className='flex gap-4'>
          <BadgeCheckIcon
            size={30}
            animate='check'
            className='mt-1 shrink-0 text-[#f0c36a]'
            aria-hidden
          />
          <div>
            <h3 className='font-utekos-text-medium text-foreground'>
              Din NBCC-fordel
            </h3>
            <p className='dark:text-dark-muted-foreground mt-2 text-sm leading-6 text-muted-foreground'>
              For deg som ønsker kompromissløs komfort og
              overlegen allsidighet.
            </p>
          </div>
        </div>
        <div className='flex gap-4'>
          <CompassIcon
            size={30}
            animateOnHover='default'
            className='mt-1 shrink-0 text-[#c7e6c9]'
            aria-hidden
          />
          <div>
            <h3 className='font-utekos-text-medium text-foreground'>
              Bred campingrelevans
            </h3>
            <p className='dark:text-dark-muted-foreground mt-2 text-sm leading-6 text-muted-foreground'>
              Egner seg som hånd i hanske for camping- og
              bobiltilværelsen, men også hjemme på terrassen!
            </p>
          </div>
        </div>
        <div className='flex gap-4'>
          <UsersIcon
            size={30}
            animateOnHover='default'
            className='mt-1 shrink-0 text-[#d8e7ff]'
            aria-hidden
          />
          <div>
            <h3 className='font-utekos-text-medium text-foreground'>
              Klar for neste samling
            </h3>
            <p className='dark:text-dark-muted-foreground mt-2 text-sm leading-6 text-muted-foreground'>
              Invester i alt du elsker med campinglivet og
              tilrettelegg for enda bedre og langvarige
              opplevelser.
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}
