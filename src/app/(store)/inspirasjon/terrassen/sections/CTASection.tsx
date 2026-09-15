import { InspirationCTASection } from '../../components/InspirationCTASection'

export function CTASection() {
  return (
    <InspirationCTASection
      title='Klar for flere kvelder ute?'
      lead='Finn Utekos-plagget som gjør terrassen til favorittrommet — fra vår til vinter.'
      primaryTrackId='TerrassenShopAllProductsClick'
      secondaryTrackId='TerrassenFindYourSizeClick'
      accentGlow='var(--terrace-copper)'
      showAccentGlow={false}
      disableAnimatedBlock
      sectionClassName='bg-[var(--terrace-night)] text-[var(--terrace-cream)]'
      titleClassName='text-[var(--terrace-cream)]'
      leadClassName='text-[var(--terrace-sage-soft)]'
      primaryButtonBg='var(--secondary)'
      primaryButtonText='var(--secondary-foreground)'
      secondaryButtonBg='var(--primary)'
      secondaryButtonText='var(--primary-foreground)'
      primaryButtonClassName='border-transparent shadow-[0_18px_42px_-30px_var(--secondary)]'
      secondaryButtonClassName='border-none shadow-none'
    />
  )
}
