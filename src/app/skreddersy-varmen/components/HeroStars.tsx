// Path: src/app/skreddersy-varmen/components/HeroStars.tsx

import { Star, StarHalf } from 'lucide-react'

export function HeroStars() {
  return (
    <span className='flex gap-0.5 text-primary drop-shadow-md' aria-hidden='true'>
      {[1, 2, 3, 4].map(i => (
        <Star key={i} fill='currentColor' size={15} strokeWidth={0} />
      ))}
      <StarHalf key='half' fill='currentColor' size={15} strokeWidth={0} />
    </span>
  )
}
