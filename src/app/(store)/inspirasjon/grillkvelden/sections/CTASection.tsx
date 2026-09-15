import { InspirationCTASection } from '../../components/InspirationCTASection'
import { grillCtaTheme } from '../theme/grillInspirationTheme'
import { grillSectionSurfaces } from '../theme/sectionSurfaces'

const { dark } = grillSectionSurfaces

export function CTASection() {
  return (
    <InspirationCTASection
      title='Klar for å bli nabolagets grillkonge?'
      lead='Sørg for at du har hemmeligheten til vellykket helårsgrilling i skapet. Gjestene dine vil takke deg.'
      primaryTrackId='GrillkveldenShopAllProductsClick'
      secondaryTrackId='GrillkveldenFindYourSizeClick'
      sectionClassName={dark.section}
      titleClassName={dark.heading}
      leadClassName={dark.muted}
      showAccentGlow={grillCtaTheme.showAccentGlow}
      primaryButtonBg={grillCtaTheme.primaryButtonBg}
      primaryButtonText={grillCtaTheme.primaryButtonText}
      secondaryButtonBg={grillCtaTheme.secondaryButtonBg}
      secondaryButtonText={grillCtaTheme.secondaryButtonText}
      primaryButtonClassName={grillCtaTheme.primaryButtonClassName}
      secondaryButtonClassName={grillCtaTheme.secondaryButtonClassName}
    />
  )
}
