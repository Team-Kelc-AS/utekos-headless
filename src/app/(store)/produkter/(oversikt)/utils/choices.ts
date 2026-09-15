import type { Route } from 'next'
import type { StaticImageData } from 'next/image'
import comfy1080 from '@/assets/images/comfyrobe/comfy-1080.png'
import classicBlack1080 from '@/assets/images/gallery/classic-black-1080.png'
import classicBlue1080 from '@/assets/images/gallery/classic-blue-1080.png'
import utekosTechdownDiagonaltFullfigur from '@/assets/images/techdown/utekos-techdown-diagonalt-fullfigur.webp'

interface ProductChoice {
  title: string
  description: string
  href: Route
  imageUrl: string | StaticImageData
  linkColor: string
}
export const choices: ProductChoice[] = [
  {
    title: 'Utekos TechDown™',
    description:
      'Optimalisert etter erfaringer og tilbakemeldinger. Gir maksimal komfort og bevegelsesfrihet. Perfekt for hytteliv, bobil og all utekos.',
    href: '/produkter/utekos-techdown' as Route,
    imageUrl: utekosTechdownDiagonaltFullfigur,
    linkColor: 'text-sky-800'
  },
  {
    title: 'Utekos Dun™',
    description:
      'Vårt bestselgende isolasjonsplagg, fylt med kvalitetsdun for funksjonell varme på de kaldeste dagene.',
    href: '/produkter/utekos-dun' as Route,
    imageUrl: classicBlue1080,
    linkColor: 'text-sky-800'
  },
  {
    title: 'Utekos Mikrofiber™',
    description:
      'Din lette og pålitelige følgesvenn for alt fra bynære turer til kjølige kvelder på terrassen. Enkel, funksjonell og alltid klar.',
    href: '/produkter/utekos-mikrofiber' as Route,
    imageUrl: classicBlack1080,
    linkColor: 'text-sky-800'
  },
  {
    title: 'Comfyrobe™',
    description:
      'Vanntett, vindtett og fôret med myk plysj. Holder deg garantert varm og tørr etter isbadet eller på en fuktig dag på campingen.',
    href: '/produkter/comfyrobe' as Route,
    imageUrl: comfy1080,
    linkColor: 'text-sky-800'
  }
]
