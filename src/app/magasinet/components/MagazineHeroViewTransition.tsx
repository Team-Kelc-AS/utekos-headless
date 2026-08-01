import { ViewTransition, type ReactNode } from 'react'
import { getMagazineHeroTransitionName } from '../utils/getMagazineHeroTransitionName'

type MagazineHeroViewTransitionProps = {
  slug: string
  children: ReactNode
}

export function MagazineHeroViewTransition({
  slug,
  children
}: MagazineHeroViewTransitionProps) {
  const transitionName =
    getMagazineHeroTransitionName(slug)

  if (!transitionName) {
    return children
  }

  return (
    <ViewTransition
      name={transitionName}
      share='magazine-hero-morph'
      default='none'
    >
      {children}
    </ViewTransition>
  )
}
