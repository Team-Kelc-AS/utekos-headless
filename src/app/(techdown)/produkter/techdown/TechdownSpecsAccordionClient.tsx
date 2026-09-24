'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import type {
  ProductAccordionGroup,
  ProductAccordionSection
} from '@/db/data/products/product-page-content'
import styles from './TechdownContent.module.css'

function SpecGroup({ group }: { group: ProductAccordionGroup }) {
  return (
    <div className={styles.specGroup}>
      {group.title ? <h3>{group.title}</h3> : null}

      {group.rows && group.rows.length > 0 ?
        <dl className={styles.specRows}>
          {group.rows.map(row => (
            <div key={row.label} className={styles.specRow}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      : null}

      {group.paragraphs?.map(paragraph => (
        <p key={paragraph}>{paragraph}</p>
      ))}

      {group.items && group.items.length > 0 ?
        <ul>
          {group.items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      : null}

      {group.note ?
        <aside>
          <strong>{group.note.title}</strong>
          <p>{group.note.text}</p>
        </aside>
      : null}
    </div>
  )
}

export function TechdownSpecsAccordionClient({
  sections
}: {
  sections: readonly ProductAccordionSection[]
}) {
  return (
    <section
      className={styles.specs}
      aria-labelledby='techdown-specs-heading'
    >
      <h2 id='techdown-specs-heading'>Produktspesifikasjoner</h2>
      <Accordion
        multiple={false}
        className={styles.specsAccordion}
      >
        {sections.map(section => (
          <AccordionItem
            key={section.id}
            value={section.id}
            className={styles.specsItem}
          >
            <AccordionTrigger className={styles.specsTrigger}>
              {section.title}
            </AccordionTrigger>
            <AccordionContent className={styles.specsContent}>
              {section.groups.map((group, index) => (
                <SpecGroup
                  key={`${section.id}-${group.title ?? index}`}
                  group={group}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
