import {
  getProductPageContent,
  type ProductAccordionGroup,
  type ProductAccordionSectionId
} from '@/db/data/products/product-page-content'
import { cn } from '@/lib/utils/className'

function ProductSpecGroup({
  group
}: {
  group: ProductAccordionGroup
}) {
  return (
    <div className='space-y-3'>
      {group.title ?
        <h4 className='font-utekos-text-medium text-base leading-snug text-foreground'>
          {group.title}
        </h4>
      : null}

      {group.rows && group.rows.length > 0 ?
        <dl className='grid gap-3 sm:grid-cols-2'>
          {group.rows.map(row => (
            <div key={row.label}>
              <dt className='font-utekos-text-medium text-sm leading-[1.35] text-foreground'>
                {row.label}
              </dt>
              <dd className='mt-1 text-sm leading-normal text-pretty text-foreground/82'>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      : null}

      {group.paragraphs?.map(paragraph => (
        <p
          key={paragraph}
          className='text-base leading-[1.65] text-pretty text-card-foreground/86'
        >
          {paragraph}
        </p>
      ))}

      {group.items && group.items.length > 0 ?
        <ul className='space-y-2 pl-5 text-base leading-[1.55] text-card-foreground/86'>
          {group.items.map(item => (
            <li
              key={item}
              className='list-disc marker:text-card-foreground/55'
            >
              {item}
            </li>
          ))}
        </ul>
      : null}

      {group.note ?
        <div className='border-t border-white/10 pt-4 text-foreground'>
          <h4 className='font-sans text-base leading-tight'>
            {group.note.title}
          </h4>
          <p className='mt-2 text-sm leading-[1.6] text-pretty text-foreground/86'>
            {group.note.text}
          </p>
        </div>
      : null}
    </div>
  )
}

function specCardPlacement(
  id: ProductAccordionSectionId
): string {
  switch (id) {
    case 'funksjoner':
      return 'md:row-span-2'
    case 'vaskeanvisning':
      return 'md:col-span-2'
    case 'materialer':
    case 'passform':
    case 'egenskaper':
    case 'bruksomrader':
      return ''
    default: {
      const _exhaustive: never = id
      return _exhaustive
    }
  }
}

const comfyrobeSpecs = (
  getProductPageContent('comfyrobe')?.accordion ?? []
).filter(section => section.id !== 'egenskaper')

export function ComfyrobeProductDetailsSection() {
  if (comfyrobeSpecs.length === 0) {
    return null
  }

  return (
    <section
      id='comfyrobe-product-details'
      className='bg-background px-6 py-16 font-sans text-foreground md:px-12 md:py-24 lg:px-16 lg:py-32'
      aria-labelledby='comfyrobe-product-details-heading'
    >
      <div className='mx-auto max-w-7xl'>
        <header className='max-w-2xl'>
          <p className='font-utekos-text-medium text-sm tracking-[0.18em] text-primary uppercase'>
            Produktdetaljer
          </p>
          <h2
            id='comfyrobe-product-details-heading'
            className='font-google-sans mt-3 scroll-mt-24 text-balance font-sans text-4xl leading-[0.94] font-bold tracking-tight md:text-6xl'
          >
            Stoff, snitt og stell
          </h2>
          <p className='mt-5 max-w-xl font-utekos-text text-base leading-relaxed text-pretty text-foreground/80 md:text-lg'>
            HydroGuard™-skall, SherpaCore™-fôr og en romslig
            unisex-passform – med stell som bevarer
            vanntettheten.
          </p>
        </header>

        <div className='mt-12 grid gap-3 md:mt-16 md:grid-cols-2 md:gap-4 lg:gap-5'>
          {comfyrobeSpecs.map(section => (
            <div
              key={section.id}
              className={cn(
                'rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-1.5',
                specCardPlacement(section.id)
              )}
            >
              <article className='h-full rounded-[calc(1.5rem-0.375rem)] bg-jungle px-6 py-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] md:px-8 md:py-8'>
                <h3 className='font-google-sans text-2xl leading-tight font-bold tracking-tight text-foreground'>
                  {section.title}
                </h3>
                <div className='mt-5 max-w-prose space-y-6 font-utekos-text'>
                  {section.groups.map((group, index) => (
                    <ProductSpecGroup
                      key={`${group.title ?? section.id}-${index}`}
                      group={group}
                    />
                  ))}
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
