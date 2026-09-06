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
import {
  landingAccordionContentClassName,
  landingAccordionItemClassName,
  landingAccordionTriggerClassName
} from './landingAccordionStyles'

function Section({
  section
}: {
  section: ProductAccordionSection
}) {
  return (
    <AccordionItem
      value={section.id}
      className={landingAccordionItemClassName}
    >
      <AccordionTrigger
        className={landingAccordionTriggerClassName}
      >
        {section.title}
      </AccordionTrigger>
      <AccordionContent
        className={landingAccordionContentClassName}
      >
        <div className='max-w-prose space-y-6 font-utekos-text'>
          {section.groups.map((group, index) => (
            <section
              key={`${group.title ?? section.id}-${index}`}
              className='space-y-3'
            >
              {group.title && (
                <h3 className='font-sans text-lg leading-[1.2] tracking-normal text-foreground'>
                  {group.title}
                </h3>
              )}
              {group.rows && group.rows.length > 0 && (
                <dl className='grid gap-3 sm:grid-cols-2'>
                  {group.rows.map(row => (
                    <div
                      key={row.label}
                      className='bg-dark-teal rounded-lg border border-border p-3'
                    >
                      <dt className='font-sans text-sm leading-[1.35] tracking-normal text-foreground'>
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
                  className='text-base leading-[1.6] tracking-normal text-foreground/90'
                >
                  {paragraph}
                </p>
              ))}
              {group.items && group.items.length > 0 && (
                <ul className='space-y-2 pl-5 text-base leading-[1.55] tracking-normal text-foreground/90'>
                  {group.items.map(item => (
                    <li
                      key={item}
                      className='list-disc marker:text-foreground/55'
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {group.note && (
                <div className='google-sans bg-dark-teal rounded-lg border border-border p-4 text-foreground'>
                  <h4 className='font-sans text-base leading-tight tracking-normal'>
                    {group.note.title}
                  </h4>
                  <p className='utekos-text mt-2 text-sm leading-[1.6] tracking-normal text-foreground/90'>
                    {group.note.text}
                  </p>
                </div>
              )}
            </section>
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
    <section
      key={selectedModel}
      className='w-full bg-night pt-6 pb-24 text-foreground'
      aria-live='polite'
    >
      <div className='mx-auto max-w-3xl px-4'>
        <h2 className='my-8 text-left font-sans text-3xl font-extrabold tracking-normal text-foreground sm:text-center sm:text-5xl'>
          Produktdetaljer
        </h2>

        <Accordion
          key={`details-${selectedModel}`}
          multiple={false}
          className='w-full gap-3'
        >
          {sections.map(section => (
            <Section key={section.id} section={section} />
          ))}
        </Accordion>
      </div>
    </section>
  )
}
