import { H1 } from '@/components/typography/TypographyH1'
import { Ingress } from '@/components/typography/Ingress'
import { SectionBox } from '@/components/layout/SectionBox'

export function GrillHeroSection() {
  return (
    <SectionBox bgcolor='bg-background border-b border-border'>
      <hgroup>
        <H1
          ID='grillkvelden-som-aldri-tar-slutt'
          Text='Grillkvelden som aldri tar slutt'
          className='mb-6'
        />
        <Ingress Text='Bli verten for de uforglemmelige kveldene, der de gode samtalene og latteren fortsetter lenge etter at den siste pølsen er grillet.' />
      </hgroup>
    </SectionBox>
  )
}
