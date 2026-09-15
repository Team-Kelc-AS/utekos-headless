import type { LucideIcon, LucideProps } from 'lucide-react'

export type BenefitIcon =
  | LucideIcon
  | React.ComponentType<LucideProps>

export interface UseCase {
  icon: LucideIcon
  time: string
  title: string
  description: string
  temperature: string
}

export interface Benefit {
  icon: BenefitIcon
  title: string
  description: string
  benefitColor: string
  iconColor: string
}

export interface Destination {
  name: string
  season: string
  highlight: string
  bgColor: string
  iconBgColor: string
  iconColor: string
  textColor: string
}
