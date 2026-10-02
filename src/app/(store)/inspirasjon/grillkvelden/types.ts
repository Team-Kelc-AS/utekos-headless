import type { AppIcon } from '@/components/utekos-icons'

export interface UseCase {
  icon: AppIcon
  time: string
  title: string
  description: string
  color: string
  iconColor: string
  iconBackground: string
}

export interface Benefit {
  icon: AppIcon
  title: string
  description: string
  iconBackground: string
}

export interface HostTip {
  name: string
  highlight: string
  icon: AppIcon
}
