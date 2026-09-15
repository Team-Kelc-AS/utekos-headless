import type { ComponentType } from 'react'

export type SectionIcon = ComponentType<{ className?: string }>

export interface UseCase {
  icon: SectionIcon
  time: string
  title: string
  description: string
  temperature: string
  color: string
  iconColor: string
  bgColor?: string
}

export interface Benefit {
  icon: SectionIcon
  title: string
  description: string
  color: string
  bgColor?: string
}

export interface Destination {
  icon: SectionIcon
  name: string
  season: string
  highlight: string
}
