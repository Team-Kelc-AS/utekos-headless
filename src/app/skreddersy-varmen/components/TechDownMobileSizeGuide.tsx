import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'

type TechDownMobileSizeGuideSize = {
  size: string
  height: string
  tips: readonly string[]
}

type TechDownMobileSizeGuideProps = {
  sizes: readonly TechDownMobileSizeGuideSize[]
}

export function TechDownMobileSizeGuide({
  sizes
}: TechDownMobileSizeGuideProps) {
  const defaultSize = sizes[0]?.size ?? ''

  return (
    <section
      aria-label='Størrelsesveiledning'
      className='overflow-hidden rounded-2xl border border-foreground/15 bg-night text-foreground'
    >
      <Tabs defaultValue={defaultSize} className='w-full gap-0'>
        <TabsList className='mx-4 mt-4 grid w-auto grid-cols-3 items-stretch rounded-lg border border-foreground/15 bg-night p-0.5 group-data-[orientation=horizontal]/tabs:h-14'>
          {sizes.map(({ size }) => (
            <TabsTrigger
              key={size}
              value={size}
              className='h-full min-h-0 rounded-md border-0 bg-jungle px-1.5 py-0 text-center font-utekos-text-medium text-[11px] leading-tight text-foreground hover:text-foreground sm:text-sm data-active:bg-primary data-active:text-primary-foreground data-active:shadow-sm'
            >
              {size}
            </TabsTrigger>
          ))}
        </TabsList>

        {sizes.map(({ size, height, tips }) => (
          <TabsContent key={size} value={size} className='mt-0'>
            <section className='px-4 pt-4 pb-4'>
              <h3 className='font-utekos-text-medium text-xs tracking-[0.08em] text-foreground/80 uppercase'>
                Anbefalt høyde
              </h3>
              <dl className='mt-2'>
                <div className='flex min-h-14 items-center justify-center rounded-xl bg-background px-3 py-2 text-center'>
                  <dt className='sr-only'>{size}</dt>
                  <dd className='font-utekos-text-medium text-sm leading-snug text-foreground'>
                    {height}
                  </dd>
                </div>
              </dl>
            </section>

            <section className='mb-4 border-t border-foreground/15 bg-night p-4'>
              <h3 className='font-utekos-text-medium text-xs tracking-[0.08em] text-foreground/80 uppercase'>
                Passform og romslighet
              </h3>
              <article className='mt-3 rounded-xl border border-foreground/10 bg-jungle px-3 py-3'>
                <h4 className='font-utekos-text-medium text-sm text-foreground'>
                  {size}
                </h4>
                <ul className='mt-1.5 space-y-1.5 text-sm leading-relaxed text-foreground/90'>
                  {tips.map(tip => (
                    <li
                      key={tip}
                      className='relative pl-3 before:absolute before:top-[0.65em] before:left-0 before:size-1 before:rounded-full before:bg-primary'
                    >
                      {tip}
                    </li>
                  ))}
                </ul>
              </article>
            </section>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
