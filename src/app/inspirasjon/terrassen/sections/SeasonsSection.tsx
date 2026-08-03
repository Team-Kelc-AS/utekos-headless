import { InspirationSeasonsSection } from '../../components/InspirationSeasonsSection'
import { terraceSeasons } from '../utils/terraceSeasons'

export function SeasonsSection() {
  return (
    <InspirationSeasonsSection
      title='Terrassen i alle årstider'
      lead='Små grep som forlenger utesesongen — uansett vær.'
      seasons={terraceSeasons}
      defaultValue='summer'
      glowTokens={['var(--terrace-copper)', 'var(--terrace-forest)']}
      sectionClassName='bg-[var(--terrace-paper)] text-[var(--terrace-ink)]'
      titleClassName='text-left text-[clamp(3rem,6vw,5.75rem)] leading-[0.95] text-[var(--terrace-ink)]'
      leadClassName='text-[var(--terrace-muted)]'
      tabTriggerClassName='border-none bg-jungle text-foreground hover:brightness-110 data-active:border data-active:border-foreground/35 data-active:bg-jungle data-active:text-foreground'
      tabActiveClassName='text-foreground'
      tabInactiveClassName='text-foreground/75'
      contentCardClassName='border-none bg-jungle text-foreground shadow-[0_22px_72px_-58px_rgb(16_32_31/0.5)]'
      contentIconClassName='border-[var(--terrace-line-light)] bg-dark-teal text-foreground'
      contentIconGlyphClassName='text-foreground'
      contentTitleClassName='text-foreground'
      contentTextClassName='text-foreground/80'
      showSectionGlow={false}
      showTabGlow={false}
      showCardGlow={false}
    />
  )
}
