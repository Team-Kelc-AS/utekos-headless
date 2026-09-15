import BrandBadge from '@/components/BrandComponents/utils/BrandBadge'
import { BusFront, House, Lightbulb, Sparkles, Sun, Waves } from 'lucide-react'
import type { ComponentType } from 'react'
import type { MagazineCategory } from '../types'

type MagazineCategoryBadgeProps = {
  category: MagazineCategory
}

const categoryIconMap = {
  'Tips og råd': Lightbulb,
  'Om Utekos': Sparkles,
  'Hytteliv': House,
  'Terrasseliv': Sun,
  'Bobilliv': BusFront,
  'Båtliv': Waves
} satisfies Record<MagazineCategory, ComponentType<{ 'className'?: string; 'aria-hidden'?: boolean }>>

export function MagazineCategoryBadge({ category }: MagazineCategoryBadgeProps) {
  const Icon = categoryIconMap[category]

  return (
    <BrandBadge
      backgroundColor='var(--color-magazine-article-card-pill)'
      textColor='var(--background)'
      className='font-utekos-text-medium gap-1.5 rounded-lg border border-background/15 px-4 py-2 text-sm leading-[1.35] tracking-tight'
    >
      <Icon className='size-3 shrink-0' aria-hidden />
      <small className='font-utekos-text-medium text-sm tracking-tight'>{category}</small>
    </BrandBadge>
  )
}
