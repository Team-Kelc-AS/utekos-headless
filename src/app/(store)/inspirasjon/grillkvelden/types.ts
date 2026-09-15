import type { LucideIcon } from 'lucide-react'

export interface UseCase {
  icon: LucideIcon
  time: string
  title: string
  description: string
  color: string
  iconColor: string
  iconBackground: string
}

export interface Benefit {
  icon: LucideIcon
  title: string
  description: string
  iconBackground: string
}

export interface HostTip {
  name: string
  highlight: string
  icon: LucideIcon
}
