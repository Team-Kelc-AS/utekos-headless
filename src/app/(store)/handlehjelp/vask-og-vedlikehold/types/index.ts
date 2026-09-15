// Path: src/app/(store)/handlehjelp/vask-og-vedlikehold/types/index.ts

import type { LucideIcon } from 'lucide-react'

export type FAQ = {
  question: string
  answer: string
}

export type CareListProps = {
  variant: 'do' | 'dont'
  title: string
  items: readonly string[]
}

export type CareStep = {
  id: string
  step: string
  title: string
  icon: LucideIcon
  content: React.ReactNode
}
