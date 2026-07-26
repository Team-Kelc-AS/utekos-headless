import { GridCross } from '@/components/legal/GridCross'
export const SectionWrapper = ({
  id,
  title,
  children
}: {
  id: string
  title: string
  children: React.ReactNode
}) => (
  <article id={id} className='relative scroll-mt-24 py-12'>
    <GridCross className='top-[60px] left-[-16px] hidden lg:block' />
    <GridCross className='top-[60px] right-[-16px] hidden lg:block' />
    <div className='absolute inset-x-0 top-[75px] hidden h-px border-t border-dashed border-white/10 lg:block' />
    <h2 className='font-utekos-text-medium text-2xl sm:text-3xl'>
      {title}
    </h2>
    <div className='prose /80 prose-invert mt-6 max-w-none text-foreground/80'>
      {children}
    </div>
  </article>
)
