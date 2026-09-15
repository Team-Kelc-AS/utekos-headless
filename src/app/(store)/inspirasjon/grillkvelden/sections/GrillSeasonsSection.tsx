import { InspirationSeasonsSection } from '../../components/InspirationSeasonsSection'
import { grillSeasons } from '../data/grillSeasons'
import { grillSeasonsCardTheme } from '../theme/grillInspirationTheme'

export function GrillSeasonsSection() {
  return (
    <InspirationSeasonsSection
      title='Grilling i alle sesonger'
      lead='Hold varmen ved grillen — fra tidlig vår til sen høst.'
      seasons={grillSeasons}
      defaultValue='autumn'
      sectionClassName='bg-demitasse text-foreground'
      titleClassName='text-foreground'
      leadClassName='text-foreground'
      showSectionGlow={false}
      showTabGlow={false}
      showCardGlow={false}
      {...grillSeasonsCardTheme}
    />
  )
}
