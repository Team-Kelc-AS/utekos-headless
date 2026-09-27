import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { faqItems } from '../utils/comparisonData'
import styles from '../comparisonGuide.module.css'

export function ComparisonFaq() {
  return (
    <Accordion
      multiple={false}
      defaultValue={[]}
      className={styles.faq}
    >
      {faqItems.map(item => (
        <AccordionItem key={item.question} value={item.question}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent keepMounted>
            <p>{item.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
