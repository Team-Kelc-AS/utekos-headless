import type { LucideIcon } from 'lucide-react'

export interface InspirationHeroFeature {
  title: string
  description: string
  icon: LucideIcon
  surface?: string
  border?: string
  shadow?: string
  marker?: string
  glow?: string | null
  sheen?: boolean
  iconSurface?: string
  iconColor?: string
  iconBorder?: string
  titleColor?: string
  descriptionColor?: string
  cardClassName?: string
  iconClassName?: string
  titleClassName?: string
  descriptionClassName?: string
}

export type InspirationHeroAlign = 'left' | 'center'
