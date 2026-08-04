import { InspirationSeasonsSection } from '../components/InspirationSeasonsSection'
import { boatingSeasons } from './boatingSeasons'

export function BoatSeasonSection() {
  return (
    <InspirationSeasonsSection
      title='Tips for en lengre sesong'
      lead='Nyt båtlivet fra tidlig vår til sen høst'
      seasons={boatingSeasons}
      defaultValue='summer'
      glowTokens={['var(--ancient-water)', 'var(--primary)']}
      tabTriggerClassName='border-foreground/18 bg-havdyp text-foreground hover:bg-havdyp/90 data-active:border-foreground data-active:bg-havdyp data-active:text-foreground'
      tabActiveClassName='text-foreground'
      tabInactiveClassName='text-foreground'
      contentCardClassName='border-foreground/18 bg-card dark:bg-card'
      contentIconClassName='border-foreground/18 bg-foreground text-black-beauty'
      contentIconGlyphClassName='text-black-beauty'
      contentTitleClassName='text-foreground'
      contentTextClassName='text-foreground'
    />
  )
}
