const MAGAZINE_HERO_TRANSITION_SLUGS: ReadonlySet<string> =
  new Set(['hva-er-utekos'])

export const MAGAZINE_DETAIL_TRANSITION_TYPE =
  'magazine-detail'

export function getMagazineHeroTransitionName(
  slug: string
): string | null {
  if (!MAGAZINE_HERO_TRANSITION_SLUGS.has(slug)) {
    return null
  }

  return `utekos-magazine-hero-${slug}`
}
