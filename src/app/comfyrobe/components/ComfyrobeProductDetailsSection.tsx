'use client'

import {
  Activity,
  Info,
  Layers3,
  Ruler,
  TableProperties,
  WashingMachine,
  Waypoints
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  getProductPageContent,
  type ProductAccordionGroup,
  type ProductAccordionSectionId
} from '@/db/data/products/product-page-content'

const sectionIcons = {
  materialer: Layers3,
  funksjoner: Activity,
  egenskaper: TableProperties,
  bruksomrader: Waypoints,
  passform: Ruler,
  vaskeanvisning: WashingMachine
} as const satisfies Record<ProductAccordionSectionId, LucideIcon>

function AccordionGroup({ group }: { group: ProductAccordionGroup }) {
  return (
    <article className='space-y-3'>
      {group.title ?
        <h3 className='font-sans text-lg leading-[1.2] tracking-normal text-foreground'>
          {group.title}
        </h3>
      : null}

      {group.rows && group.rows.length > 0 ?
        <dl className='grid gap-3 sm:grid-cols-2'>
          {group.rows.map(row => (
            <div
              key={row.label}
              className='rounded-lg border border-border bg-background/40 p-3'
            >
              <dt className='font-utekos-text-medium text-sm leading-[1.35] text-foreground'>
                {row.label}
              </dt>
              <dd className='mt-1 text-sm leading-normal text-foreground/82'>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      : null}

      {group.paragraphs?.map(paragraph => (
        <p
          key={paragraph}
          className='text-base leading-[1.6] text-card-foreground/86'
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
        <div className='rounded-lg border border-border bg-background/55 p-4 text-foreground'>
          <h4 className='font-sans text-base leading-tight'>
            {group.note.title}
          </h4>
          <p className='mt-2 text-sm leading-[1.6] text-foreground/86'>
            {group.note.text}
          </p>
        </div>
      : null}
    </article>
  )
}

const comfyrobeAccordion =
  getProductPageContent('comfyrobe')?.accordion ?? []

export function ComfyrobeProductDetailsSection() {
  if (comfyrobeAccordion.length === 0) {
    return null
  }

  return (
    <section
      id='comfyrobe-product-details'
      className='bg-background px-6 py-16 text-foreground font-sans md:py-24'
      aria-labelledby='comfyrobe-details-heading'
    >
      <div className='md:max-w-[85%] mx-auto'>
        <BrandBadge className='gap-2 bg-jungle text-left text-foreground font-sans'>
          <Info className='size-5 font-sans' aria-hidden />
          <h2
            id='comfyrobe-details-heading'
            className='font-sans text-lg leading-[1.2] tracking-normal'
          >
            Produktdetaljer
          </h2>
        </BrandBadge>

        <Accordion className='mt-8 w-full rounded-2xl border border-border bg-jungle px-4 text-card-foreground sm:px-5'>
          {comfyrobeAccordion.map(section => {
            const Icon = sectionIcons[section.id]

            return (
              <AccordionItem
                key={section.id}
                value={section.id}
                className='border-border'
              >
                <AccordionTrigger className='py-5 text-base text-card-foreground hover:text-primary hover:no-underline **:data-[slot=accordion-trigger-icon]:text-primary'>
                  <span className='flex min-w-0 items-center gap-3 sm:gap-4'>
                    <span className='flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-dark-teal text-foreground'>
                      <Icon className='size-5' aria-hidden />
                    </span>
                    <span className='font-utekos-text-medium text-left leading-[1.2]'>
                      {section.title}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className='pb-5 text-card-foreground'>
                  <div className='max-w-prose space-y-6 font-utekos-text sm:pl-14'>
                    {section.groups.map((group, index) => (
                      <AccordionGroup
                        key={`${group.title ?? section.id}-${index}`}
                        group={group}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </div>
    </section>
  )
}
