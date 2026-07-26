import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { techDownSizeCards } from '../utils/techDownSizeCards'
import { SizeGuideSectionShell } from './SizeGuideSectionShell'
import { TechDownSizeCard } from './TechDownSizeCard'

export function TechDownSizeGuide() {
  return (
    <SizeGuideSectionShell
      id='tech-down-size-guide'
      surface='card'
      ariaLabelledby='tech-down-size-guide-heading'
    >
      <div className='max-w-5xl'>
        <BrandBadge
          label='TechDown™'
          bgColor='var(--background)'
          fgColor='var(--foreground)'
          className='mb-5 min-w-24 border border-border px-4 py-2 text-left text-lg md:px-6 md:py-3'
        />

        <h2
          id='tech-down-size-guide-heading'
          className='font-google-sans pt-4 pb-6 text-3xl leading-[1.05] font-bold text-inherit md:text-5xl lg:text-6xl'
        >
          Presisjon i hver størrelse
        </h2>

        <div className='space-y-4 font-utekos-text text-lg leading-relaxed text-inherit/90'>
          <p>
            For livsnyteren som verdsetter både funksjon og form,
            er Utekos TechDown™ designet med en mer kroppsnær
            passform.
          </p>

          <p>
            Dette gir deg suveren bevegelsesfrihet og effektiv
            varme, pakket inn i et nettere design.
          </p>

          <p>
            Perfekt for et aktivt liv på hytten, i bobilen eller
            på kjølige kvelder på terrassen.
          </p>

          <p>
            Utekos TechDown™ sine størrelser har en tradisjonell
            progresjon for å sikre at du finner en størrelse som
            passer perfekt til din kroppstype.
          </p>

          <p>
            Valget ditt bør baseres på hvordan du har tenkt til å
            bruke den og hvilken passform du foretrekker for
            tekniske plagg.
          </p>
        </div>
      </div>

      <div className='mt-14 grid w-full grid-cols-1 items-stretch gap-5 lg:grid-cols-3 lg:gap-6'>
        {techDownSizeCards.map(card => (
          <TechDownSizeCard key={card.id} card={card} />
        ))}
      </div>
    </SizeGuideSectionShell>
  )
}
