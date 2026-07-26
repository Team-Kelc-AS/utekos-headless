import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'

export const iceBathingFaqItems = [
  {
    question: 'Hvordan er størrelsene?',
    answer:
      'Comfyrobe er designet med en oversized fit, slik at du enkelt kan trekke armene inn og skifte under den.'
  },
  {
    question: 'Blir den tung når den blir våt?',
    answer:
      'Ytterstoffet er vannavvisende, og innerfôret er laget av syntetisk lammeull som ikke trekker til seg vann på samme måte som bomull. Vekten vil øke, men varmen vil beholdes selv om du tar den rett på våt hud.'
  },
  {
    question: 'Kan den vaskes i maskin?',
    answer:
      'Ja, Comfyrobe kan vaskes i vaskemaskin. Vi anbefaler et skånsomt program med mildt vaskemiddel og 40°C. Vær bevisst på hvilket vaskemiddel du bruker.'
  },
  {
    question: 'Er den vindtett?',
    answer:
      'Ytterstoffet av HydroGuard™ har en vannsøyle på 80000 mm og pustende membran (~3000 g/m²/24 t) og tapede sømmer.'
  }
] as const

export function IceBathingFAQ() {
  return (
    <article className='border-t border-foreground/12 bg-overcast py-24'>
      <div className='container mx-auto max-w-3xl px-4'>
        <h2 className='dark:text-dark-background font-google-sans mb-12 text-center text-3xl leading-[1.05] font-bold tracking-normal text-background'>
          Ofte stilte spørsmål
        </h2>

        <Accordion className='w-full'>
          {iceBathingFaqItems.map((item, index) => (
            <AccordionItem
              key={item.question}
              value={`item-${index + 1}`}
              className='dark:border-dark-background/16 border-background/16'
            >
              <AccordionTrigger className='dark:text-dark-background text-left leading-[1.35] tracking-normal text-background'>
                {item.question}
              </AccordionTrigger>
              <AccordionContent className='leading-normal tracking-normal text-havdyp'>
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </article>
  )
}
