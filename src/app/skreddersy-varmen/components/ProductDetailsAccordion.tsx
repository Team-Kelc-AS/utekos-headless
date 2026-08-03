// Path: src/app/skreddersy-varmen/components/ProductDetailsAccordion.tsx
'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { PRODUCT_PAGE_CONTENT } from '@/db/data/products/product-page-content'
import type { ModelKey } from '@/api/constants'
import type { ProductAccordionSection } from '@/db/data/products/product-page-content'

function Section({
  section
}: {
  section: ProductAccordionSection
}) {
  return (
    <AccordionItem
      value={section.id}
      className='rounded-xl border border-border bg-jungle px-4'
    >
      <AccordionTrigger className='dark:hover:text-dark-foreground dark:focus-visible:ring-dark-foreground/45 min-h-14 text-left font-sans font-utekos-text-medium text-lg tracking-normal text-foreground transition-colors hover:text-foreground hover:no-underline focus-visible:ring-2 focus-visible:ring-foreground/45 md:text-xl'>
        {section.title}
      </AccordionTrigger>
      <AccordionContent className='pt-2 pb-6'>
        <div className='max-w-prose space-y-6 font-utekos-text'>
          {section.groups.map((group, index) => (
            <article
              key={`${group.title ?? section.id}-${index}`}
              className='space-y-3'
            >
              {group.title && (
                <h3 className='font-sans font-utekos-text-medium text-lg leading-[1.2] tracking-normal text-foreground'>
                  {group.title}
                </h3>
              )}
              {group.rows && group.rows.length > 0 && (
                <dl className='grid gap-3 sm:grid-cols-2'>
                  {group.rows.map(row => (
                    <div
                      key={row.label}
                      className='dark:bg-dark-background/40 rounded-lg border border-border bg-background/40 p-3'
                    >
                      <dt className='font-utekos-text-medium text-sm leading-[1.35] tracking-normal text-foreground'>
                        {row.label}
                      </dt>
                      <dd className='/82 mt-1 text-sm leading-normal tracking-normal text-foreground/82'>
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {group.paragraphs?.map(paragraph => (
                <p
                  key={paragraph}
                  className='/86 text-base leading-[1.6] tracking-normal text-foreground/86'
                >
                  {paragraph}
                </p>
              ))}
              {group.items && group.items.length > 0 && (
                <ul className='/86 space-y-2 pl-5 text-base leading-[1.55] tracking-normal text-foreground/86'>
                  {group.items.map(item => (
                    <li
                      key={item}
                      className='dark:marker:text-dark-foreground/55 list-disc marker:text-foreground/55'
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {group.note && (
                <div className='google-sans-flex dark:bg-dark-background/55 rounded-lg border border-border bg-background/55 p-4 text-foreground'>
                  <h4 className='font-sans font-utekos-text-medium text-base leading-tight tracking-normal'>
                    {group.note.title}
                  </h4>
                  <p className='utekos-text /86 mt-2 text-sm leading-[1.6] tracking-normal text-foreground/86'>
                    {group.note.text}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export function ProductDetailsAccordion({
  selectedModel
}: {
  selectedModel: ModelKey
}) {
  const content = PRODUCT_PAGE_CONTENT[selectedModel]
  const sections = content.accordion

  if (!sections) {
    return null
  }

  return (
    <article
      key={selectedModel}
      className='dark:bg-dark-background w-full bg-background pt-6 pb-24 text-foreground'
      aria-live='polite'
    >
      <div className='mx-auto max-w-3xl px-4'>
        <h2 className='mx-auto my-8 max-w-[90%] text-left font-sans font-utekos-text-medium text-3xl tracking-normal text-foreground sm:text-center sm:text-5xl md:max-w-4xl'>
          Produktdetaljer
        </h2>

        <Accordion
          key={`details-${selectedModel}`}
          className='w-full gap-3'
        >
          {sections.map(section => (
            <Section key={section.id} section={section} />
          ))}
        </Accordion>
      </div>
    </article>
  )
}
