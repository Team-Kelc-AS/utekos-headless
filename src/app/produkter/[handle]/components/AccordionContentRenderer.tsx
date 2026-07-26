// Path: src/app/produkter/[handle]/components/AccordionContentRenderer.tsx
'use client'

import { AccordionContent } from '@/components/ui/accordion'
import type {
  ProductAccordionGroup,
  ProductAccordionSection
} from '@/db/data/products/product-page-content'

function AccordionGroup({
  group
}: {
  group: ProductAccordionGroup
}) {
  return (
    <article className='space-y-3'>
      {group.title && (
        <h3 className='font-sans font-utekos-text-medium text-lg leading-[1.2] tracking-normal text-card-foreground'>
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
          className='/86 text-base leading-[1.6] tracking-normal text-card-foreground/86'
        >
          {paragraph}
        </p>
      ))}

      {group.items && group.items.length > 0 && (
        <ul className='/86 space-y-2 pl-5 text-base leading-[1.55] tracking-normal text-card-foreground/86'>
          {group.items.map(item => (
            <li
              key={item}
              className='dark:marker:text-dark-card-foreground/55 list-disc marker:text-card-foreground/55'
            >
              {item}
            </li>
          ))}
        </ul>
      )}

      {group.note && (
        <div className='dark:bg-dark-background/55 rounded-lg border border-border bg-background/55 p-4 text-foreground'>
          <h4 className='font-sans font-utekos-text-medium text-base leading-tight tracking-normal'>
            {group.note.title}
          </h4>
          <p className='/86 mt-2 text-sm leading-[1.6] tracking-normal text-foreground/86'>
            {group.note.text}
          </p>
        </div>
      )}
    </article>
  )
}

export function AccordionContentRenderer({
  content
}: {
  content: ProductAccordionSection
}) {
  return (
    <AccordionContent className='relative z-10 px-6 pb-6 sm:pl-20'>
      <div className='max-w-prose space-y-6 font-utekos-text'>
        {content.groups.map((group, index) => (
          <AccordionGroup
            key={`${group.title ?? content.id}-${index}`}
            group={group}
          />
        ))}
      </div>
    </AccordionContent>
  )
}
