import { Coffee, Leaf, Sparkles } from 'lucide-react'
import type { InspirationHeroFeature } from '../../layout/hero/types'

export const terraceHeroFeatures: readonly InspirationHeroFeature[] = [
  {
    title: 'Tidlig vår',
    description: 'Nyt morgenkaffen uker tidligere',
    icon: Coffee
  },
  {
    title: 'Sen høst',
    description: 'Forleng sesongen',
    icon: Leaf
  },
  {
    title: 'Hver kveld',
    description: 'Nyt uteplassen når det kjølner',
    icon: Sparkles
  }
] as const
