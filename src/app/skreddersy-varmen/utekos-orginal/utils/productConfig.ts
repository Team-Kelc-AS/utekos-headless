// Path: src/app/skreddersy-varmen/utekos-orginal/utils/productConfig.ts
import blueFull from '@/assets/images/gallery/blue-full.png'
import classicBlackJacket34 from '@/assets/images/gallery/classic-black-jacket-3-4.png'

export const productConfig = {
  price: 1590,
  colors: [
    {
      id: 'vargnatt',
      name: 'Vargnatt (Sort)',
      hex: '#000000',

      image: classicBlackJacket34
    },
    {
      id: 'fjellbla',
      name: 'Fjellblå',
      hex: '#020244',

      image: blueFull
    }
  ],
  sizes: [
    { id: 'medium', name: 'Medium', desc: 'Passer de fleste opp til 175cm' },
    {
      id: 'large',
      name: 'Large',
      desc: 'For deg som vil ha ekstra romslighet (170cm+)'
    }
  ]
} as const
