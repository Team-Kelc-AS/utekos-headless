import { PRODUCT_PAGE_CONTENT } from '@/db/data/products/product-page-content'
import { TechdownSpecsAccordionClient } from './TechdownSpecsAccordionClient'

export function TechdownSpecsAccordion() {
  const specSections =
    PRODUCT_PAGE_CONTENT['utekos-techdown'].accordion

  return <TechdownSpecsAccordionClient sections={specSections} />
}
