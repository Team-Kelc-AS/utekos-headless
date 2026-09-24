import { PRODUCT_PAGE_CONTENT } from '@/db/data/products/product-page-content'
import { TechdownSpecsAccordionClient } from './TechdownSpecsAccordionClient'

export function TechdownSpecsAccordion() {
  const specSections =
    PRODUCT_PAGE_CONTENT['utekos-techdown'].accordion

  if (!specSections || specSections.length === 0) {
    return null
  }

  return <TechdownSpecsAccordionClient sections={specSections} />
}
