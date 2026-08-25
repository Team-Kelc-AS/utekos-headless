// Path: src/app/skreddersy-varmen/utekos-orginal/utils/productConfig.ts
import blueFull from '@/assets/images/gallery/blue-full.png'

export const productConfig = {
  price: 1790,
  colors: [
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
