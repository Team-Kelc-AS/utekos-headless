import { InspirationCTASection } from '../components/InspirationCTASection'

export function CTASection() {
  return (
    <InspirationCTASection
      title='Klar for lengre dager på vannet?'
      lead='Opplev varme som varer fra soloppgang til kveldsbris — hele sesongen.'
      primaryTrackId='BatlivShopAllProductsClick'
      secondaryTrackId='BatlivFindYourSizeClick'
      sectionClassName='bg-jungle'
      accentGlow='var(--very-peri)'
      primaryButtonBg='var(--primary)'
      primaryButtonText='var(--secondary-foreground)'
      secondaryButtonBg='var(--card)'
      secondaryButtonText='var(--card-foreground)'
      primaryButtonClassName='border-secondary/35 dark:border-dark-secondary/35'
      secondaryButtonClassName='border-card-foreground/24 dark:border-dark-card-foreground/24'
    />
  )
}
