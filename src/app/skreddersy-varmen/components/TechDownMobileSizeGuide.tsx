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
  return (
    <section
      aria-label='Størrelsesveiledning'
      className='overflow-hidden rounded-2xl border border-foreground/15 bg-jungle text-foreground'
    >
      <div className='grid grid-cols-3 divide-x divide-foreground/15 border-b border-foreground/15 bg-[#00453e]'>
        {sizes.map(({ size }) => (
          <h3
            key={size}
            className='flex min-h-14 items-center justify-center px-1.5 py-3 text-center font-utekos-text-medium text-[11px] leading-tight text-foreground sm:text-sm'
          >
            {size}
          </h3>
        ))}
      </div>

      <section className='p-4'>
        <h3 className='text-xs font-utekos-text-medium uppercase tracking-[0.08em] text-foreground/80'>
          Anbefalt høyde
        </h3>
        <dl className='mt-2 grid grid-cols-3 gap-2'>
          {sizes.map(({ size, height }) => (
            <div
              key={size}
              className='flex min-h-14 items-center justify-center rounded-xl bg-foreground/10 px-1.5 py-2 text-center'
            >
              <dt className='sr-only'>{size}</dt>
              <dd className='font-utekos-text-medium text-sm leading-snug text-foreground'>
                {height}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className='border-t border-foreground/15 p-4'>
        <h3 className='text-xs font-utekos-text-medium uppercase tracking-[0.08em] text-foreground/80'>
          Passform og romslighet
        </h3>
        <div className='mt-3 space-y-2'>
          {sizes.map(({ size, tips }) => (
            <article
              key={size}
              className='rounded-xl border border-foreground/10 bg-[#00453e] px-3 py-3'
            >
              <h4 className='font-utekos-text-medium text-sm text-foreground'>
                {size}
              </h4>
              <ul className='mt-1.5 space-y-1.5 text-sm leading-relaxed text-foreground/90'>
                {tips.map(tip => (
                  <li
                    key={tip}
                    className='relative pl-3 before:absolute before:left-0 before:top-[0.65em] before:size-1 before:rounded-full before:bg-primary'
                  >
                    {tip}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
