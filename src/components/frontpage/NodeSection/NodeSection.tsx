import { CustomerNetwork } from '@/components/frontpage/components/CustomerNetwork'
import { H2 } from '@/components/typography/TypographyH2'
import { P } from '@/components/typography/TypographyP'
import { PageSection } from '@/components/layout/PageSection'
import { cn } from '@/lib/utils/className'

const nodeSectionClassName =
  'relative isolate overflow-hidden rounded-[1.5rem] border border-border bg-dark-teal p-4 ring-1 ring-foreground/8 sm:p-8'

export async function NodeSection() {
  return (
    <PageSection
      as='article'
      background='muted'
      className={cn(
        'relative overflow-hidden rounded-xl text-foreground'
      )}
      contentClassName='space-y-6 py-6 sm:py-8 md:py-10 lg:py-12'
    >
      <hgroup className='mx-auto space-y-1 text-left text-foreground'>
        <H2 Text='Drevet av ekte opplevelser' ID='hello' className='font-sans! font-extrabold pb-1' />
        <P Text='Våre beste produktutviklere er kundene våre.' className='font-utekos-text-medium! not-first:mt-0 text-xl text-foreground/80' />
        <P Text='Vi lytter, lærer og designer for at du kan skape flere og bedre minner utendørs.' className='font-utekos-text-medium! not-first:mt-0 text-lg text-foreground/80!' />
      </hgroup>

      <div
        className={cn(
          nodeSectionClassName,
          'flex flex-col lg:justify-center'
        )}
      >
        <div
          className='dark:via-border pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border to-transparent'
          aria-hidden='true'
        />
        <CustomerNetwork />
      </div>
    </PageSection>
  )
}
