import type { InspirationSeasonDefinition } from '../../theme/seasons'

export const grillSeasons: InspirationSeasonDefinition[] = [
  {
    value: 'spring',
    label: 'Vår',
    iconName: 'Sun',
    iconColor: 'text-very-peri',
    glowColor: 'var(--soft-warm)',
    title: 'Sesongstarten',
    description:
      'Vær den første i nabolaget til å dra frem grillen. Med Utekos er ikke en kjølig vårkveld noen hindring for en vellykket premiere.'
  },
  {
    value: 'summer',
    label: 'Sommer',
    iconName: 'Flame',
    iconColor: 'text-very-peri',
    glowColor: 'var(--soft-warm)',
    title: 'De lange sommerkveldene',
    description:
      'Selv på sommeren blir det kaldt når solen går ned. Hold festen i gang og la gjestene bli sittende i komfort til langt på natt.'
  },
  {
    value: 'autumn',
    label: 'Høst',
    iconName: 'Leaf',
    iconColor: 'text-mountain-view',
    glowColor: 'var(--mountain-view)',
    title: 'Høstens farger og smaker',
    description:
      'Høsten er perfekt for grilling med rike smaker. Nyt den skarpe, klare luften rundt grillen med venner, uten å tenke på temperaturen.'
  },
  {
    value: 'winter',
    label: 'Vinter',
    iconName: 'Snowflake',
    iconColor: 'text-ancient-water',
    glowColor: 'var(--ancient-water)',
    title: 'For de tøffeste grill entusiastene',
    description:
      'Vintergrilling er en unik opplevelse. Utekos er essensielt for å holde grillmesteren (og gjestene) varme mellom slagene.'
  }
]
