import type { InspirationSeasonDefinition } from '../theme/seasons'

export const boatingSeasons: InspirationSeasonDefinition[] = [
  {
    value: 'spring',
    label: 'Vår',
    iconName: 'LifeBuoy',
    iconColor: 'text-ancient-water',
    glowColor: 'var(--ancient-water)',
    title: 'Komfort under vårpussen',
    description:
      'Vårpussen kan være en kald fornøyelse. Hold varmen mens du gjør båten klar for sesongens eventyr, selv på kjølige aprildager.'
  },
  {
    value: 'summer',
    label: 'Sommer',
    iconName: 'Sun',
    iconColor: 'text-primary',
    glowColor: 'var(--primary)',
    title: 'Når solen har gått ned',
    description:
      'Ikke la gåsehuden jage deg under dekk. Forleng de magiske sommerkveldene i cockpiten eller på flybridgen.'
  },
  {
    value: 'autumn',
    label: 'Høst',
    iconName: 'Fish',
    iconColor: 'text-very-peri',
    glowColor: 'var(--soft-warm)',
    title: 'Høstfiske i komfort',
    description:
      'Høsten byr på fantastisk lys og gode fiskemuligheter. Nyt den skarpe, klare luften uten å fryse mens du venter på napp.'
  },
  {
    value: 'winter',
    label: 'Vinter',
    iconName: 'Anchor',
    iconColor: 'text-ancient-water',
    glowColor: 'var(--overcast)',
    title: 'Tilsyn i Vinteropplag',
    description:
      'Selv om båten ligger på land, krever den tilsyn. Gjør de kalde turene til havna for å sjekke presenning og motor langt mer behagelige.'
  }
]
