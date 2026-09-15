import type { LucideIcon } from 'lucide-react'
import {
  Flame,
  Leaf,
  Moon,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  Sun,
  ThermometerSun,
  Waves
} from 'lucide-react'

import {
  UtekosCard,
  UtekosCardActionButton,
  UtekosCardActions,
  UtekosCardContent,
  UtekosCardDescription,
  UtekosCardEyebrow,
  UtekosCardGrid,
  UtekosCardHeader,
  UtekosCardIcon,
  UtekosCardStat,
  UtekosCardTitle,
  type UtekosCardPalette
} from '@/components/cards/utekos-card'

type ShowcaseCard = {
  title: string
  description: string
  eyebrow: string
  palette: UtekosCardPalette
  icon: LucideIcon
  primaryAction: string
  secondaryAction?: string
  featured?: boolean
  wide?: boolean
}

type PaletteNote = {
  title: string
  description: string
  palette: UtekosCardPalette
}

const showcaseCards = [
  {
    title: 'Forleng kvelden ute',
    description:
      'Et lunt komfortlag for terrassen når temperaturen faller, men samtalen fortsatt er god.',
    eyebrow: 'Terrasse',
    palette: 'maritime',
    icon: Waves,
    primaryAction: 'Utforsk terrassen',
    secondaryAction: 'Se produktet',
    featured: true
  },
  {
    title: 'Lys produktflate',
    description:
      'Bruk denne paletten når bildet eller produktinformasjonen skal få hovedrollen.',
    eyebrow: 'Produkt',
    palette: 'sand',
    icon: ShieldCheck,
    primaryAction: 'Se detaljer',
    secondaryAction: 'Sammenlign',
    wide: true
  },
  {
    title: 'Varme rundt bålet',
    description:
      'Skap mer ro, nærhet og kvalitetstid rundt flammene uten at kulden styrer tidspunktet.',
    eyebrow: 'Bålplass',
    palette: 'ember',
    icon: Flame,
    primaryAction: 'Se bålbruk'
  },
  {
    title: 'Hyttemorgen uten hast',
    description:
      'Komfort for de små overgangene: kaffekoppen ute, morgenluft og rolige minutter før dagen starter.',
    eyebrow: 'Hytte',
    palette: 'forest',
    icon: Leaf,
    primaryAction: 'Se hyttebruk'
  },
  {
    title: 'Mykere gaveopplevelse',
    description:
      'En gave som handler om varme, tid sammen og følelsen av å bli tatt vare på.',
    eyebrow: 'Gave',
    palette: 'rose',
    icon: Sparkles,
    primaryAction: 'Finn gave'
  },
  {
    title: 'Kveld, sjø og stillhet',
    description:
      'En kjøligere, lettere palett for innhold om sjø, båt, ro og overgangen mellom dag og kveld.',
    eyebrow: 'Sjøliv',
    palette: 'tide',
    icon: Moon,
    primaryAction: 'Utforsk sjøliv'
  },
  {
    title: 'Varm nok, men ikke innestengt',
    description:
      'Kommuniser funksjonelt: komfort, fleksibilitet og varme uten å gjøre kortet teknisk tungt.',
    eyebrow: 'Funksjon',
    palette: 'peri',
    icon: ThermometerSun,
    primaryAction: 'Les mer'
  },
  {
    title: 'Sommer, skygge og sen lunsj',
    description:
      'Et lettere uttrykk for sommerlige bruksområder der Utekos handler om hygge mer enn ekstremvær.',
    eyebrow: 'Sommer',
    palette: 'plum',
    icon: Sun,
    primaryAction: 'Se sommerbruk'
  }
] satisfies ShowcaseCard[]

const stats = [
  {
    value: '3',
    label: 'hovedfamilier',
    detail: 'Maritim base, varm kontrast og naturkomplement.'
  },
  {
    value: '8',
    label: 'paletter',
    detail: 'Nok variasjon uten å miste Utekos-signalet.'
  },
  {
    value: '3',
    label: 'gridmoduser',
    detail: 'Mosaic, cluster og rail for ulike innholdsrytmer.'
  }
]

const paletteNotes = [
  {
    title: 'Maritim base',
    description:
      'Canva-sporet peker mot dype blåfiolette flater. I kode mappes dette til maritime-darkest, havdyp og kontrollerte blå tints.',
    palette: 'maritime'
  },
  {
    title: 'Varm kontrast',
    description:
      'Plomme, ganache og rose gir varme mot den maritime basen uten å konkurrere med primærknappen.',
    palette: 'plum'
  },
  {
    title: 'Naturkomplement',
    description:
      'Olive, mountain-view og fairy-tale-tints dekker hytte, skog og gaveflater med roligere harmonier.',
    palette: 'forest'
  }
] satisfies PaletteNote[]

export default function CardShowCase() {
  return (
    <article className='mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto flex max-w-3xl flex-col gap-4 text-center'>
        <UtekosCardEyebrow className='mx-auto'>
          Shadcn workbench
        </UtekosCardEyebrow>
        <h1 className='text-foreground'>
          Kortsystem for inspirasjon
        </h1>
        <p className='utekos-section-lead /80 text-foreground/80'>
          Gjenbrukbare kort bygget på shadcn Card, Utekos tokens
          og faste paletter for sesong, brukssituasjon og
          produktdybde.
        </p>
      </div>

      <UtekosCardGrid layout='cluster'>
        {paletteNotes.map(note => (
          <UtekosCard
            key={note.title}
            palette={note.palette}
            surface='stitched'
            density='compact'
          >
            <UtekosCardHeader>
              <UtekosCardIcon icon={Paintbrush} />
              <UtekosCardTitle className='text-lg md:text-xl'>
                {note.title}
              </UtekosCardTitle>
              <UtekosCardDescription>
                {note.description}
              </UtekosCardDescription>
            </UtekosCardHeader>
          </UtekosCard>
        ))}
      </UtekosCardGrid>

      <UtekosCardGrid layout='mosaic'>
        {showcaseCards.map(card => (
          <UtekosCard
            key={card.title}
            palette={card.palette}
            interactive
            data-featured={card.featured ? 'true' : undefined}
            data-wide={card.wide ? 'true' : undefined}
          >
            <UtekosCardHeader>
              <div className='flex items-start gap-4'>
                <UtekosCardIcon icon={card.icon} />
                <div className='flex min-w-0 flex-1 flex-col gap-3'>
                  <UtekosCardEyebrow>
                    {card.eyebrow}
                  </UtekosCardEyebrow>
                  <UtekosCardTitle>{card.title}</UtekosCardTitle>
                  <UtekosCardDescription>
                    {card.description}
                  </UtekosCardDescription>
                </div>
              </div>
            </UtekosCardHeader>

            <UtekosCardActions>
              <UtekosCardActionButton>
                {card.primaryAction}
              </UtekosCardActionButton>

              {card.secondaryAction ?
                <UtekosCardActionButton emphasis='secondary'>
                  {card.secondaryAction}
                </UtekosCardActionButton>
              : null}
            </UtekosCardActions>
          </UtekosCard>
        ))}
      </UtekosCardGrid>

      <UtekosCardGrid layout='cluster'>
        {stats.map(stat => (
          <UtekosCard
            key={stat.label}
            palette='sand'
            surface='stitched'
            density='compact'
          >
            <UtekosCardContent>
              <UtekosCardStat
                value={stat.value}
                label={stat.label}
                detail={stat.detail}
              />
            </UtekosCardContent>
          </UtekosCard>
        ))}
      </UtekosCardGrid>

      <UtekosCardGrid
        layout='rail'
        bleed='section'
        aria-label='Kompakte kortvarianter'
      >
        {showcaseCards.slice(0, 6).map(card => (
          <UtekosCard
            key={`rail-${card.title}`}
            palette={card.palette}
            density='compact'
            interactive
          >
            <UtekosCardHeader>
              <UtekosCardEyebrow>
                {card.eyebrow}
              </UtekosCardEyebrow>
              <UtekosCardTitle className='text-lg md:text-xl'>
                {card.title}
              </UtekosCardTitle>
              <UtekosCardDescription>
                {card.description}
              </UtekosCardDescription>
            </UtekosCardHeader>
          </UtekosCard>
        ))}
      </UtekosCardGrid>
    </article>
  )
}

export { CardShowCase }
