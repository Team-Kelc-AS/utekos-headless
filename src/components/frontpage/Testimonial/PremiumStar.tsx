// Path: src/components/frontpage/PremiumStar.tsx

import { getStableDelay } from '@/components/frontpage/MomentSection/utils/getStableDelay'

interface PremiumStarProps {
  isFull: boolean
  isHalf: boolean
  seed: number
}

export function PremiumStar({ isFull, isHalf, seed }: PremiumStarProps) {
  const d1 = getStableDelay(seed, 1.45)
  const d2 = getStableDelay(seed, 2.92)

  const sharpStarPath = 'M12 2L14.4 9.6H22L15.8 14.2L18.2 21.8L12 17.2L5.8 21.8L8.2 14.2L2 9.6H9.6L12 2Z'

  const flarePath = 'M4 0L4.8 3.2L8 4L4.8 4.8L4 8L3.2 4.8L0 4L3.2 3.2L4 0Z'

  if (!isFull && !isHalf) {
    return (
      <svg viewBox='0 0 24 24' className='h-4 w-4 drop-shadow-sm' aria-hidden='true' focusable='false'>
        <path d={sharpStarPath} className='fill-card/80 stroke-card stroke-1' />
      </svg>
    )
  }

  return (
    <div className='relative h-4 w-4' aria-hidden='true'>
      <svg
        viewBox='0 0 24 24'
        className='size-full overflow-visible drop-shadow-md'
        aria-hidden='true'
        focusable='false'
      >
        <defs>
          <linearGradient id={`luxuryGold-${seed}`} x1='10%' y1='0%' x2='90%' y2='100%'>
            <stop offset='0%' stopColor='#FEF3C7' />
            <stop offset='45%' stopColor='#F59E0B' />
            <stop offset='100%' stopColor='#B45309' />
          </linearGradient>

          <clipPath id={`halfClip-${seed}`}>
            <rect x='0' y='0' width='12' height='24' />
          </clipPath>
        </defs>

        <path
          d={sharpStarPath}
          fill={`url(#luxuryGold-${seed})`}
          clipPath={isHalf ? `url(#halfClip-${seed})` : undefined}
          className='drop-shadow-sm'
        />

        <g clipPath={isHalf ? `url(#halfClip-${seed})` : undefined}>
          <path
            d={flarePath}
            fill='white'
            className='animate-glint origin-center opacity-0'
            transform='translate(13, 3) scale(0.6)'
            style={{ animationDelay: `${d1}s` }}
          />

          <path
            d={flarePath}
            fill='white'
            className='animate-glint origin-center opacity-0'
            transform='translate(4, 12) scale(0.4)'
            style={{ animationDelay: `${d2}s` }}
          />
        </g>

        <path
          d={sharpStarPath}
          fill='white'
          fillOpacity='0.1'
          clipPath={isHalf ? `url(#halfClip-${seed})` : undefined}
          style={{ pointerEvents: 'none' }}
        />
      </svg>
    </div>
  )
}
