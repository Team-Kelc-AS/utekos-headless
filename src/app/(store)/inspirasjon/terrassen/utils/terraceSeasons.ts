import type { InspirationSeasonDefinition } from '../../theme/seasons'

export const terraceSeasons: InspirationSeasonDefinition[] = [
  {
    value: 'spring',
    label: 'Vår',
    iconName: 'Sun',
    iconColor: 'text-[var(--terrace-night)]',
    glowColor: 'var(--terrace-copper)',
    title: 'Den første kaffen ute',
    description:
      'Det er noe magisk med den første dagen det er varmt nok til å sitte ute. Med Utekos kan den dagen komme uker tidligere.'
  },
  {
    value: 'summer',
    label: 'Sommer',
    iconName: 'GlassWater',
    iconColor: 'text-[var(--terrace-night)]',
    glowColor: 'var(--terrace-copper)',
    title: 'Når duggfallet kommer',
    description:
      'Ikke la den kjølige kveldsluften avslutte den gode samtalen. Forleng de lyse sommerkveldene til langt etter at solen har gått ned.'
  },
  {
    value: 'autumn',
    label: 'Høst',
    iconName: 'Leaf',
    iconColor: 'text-[var(--terrace-night)]',
    glowColor: 'var(--terrace-copper)',
    title: 'Høstkvelder med klar luft',
    description: 'Pakk deg inn i komfort og nyt den skarpe, klare høstluften med en kopp te og en god bok.'
  },
  {
    value: 'winter',
    label: 'Vinter',
    iconName: 'Snowflake',
    iconColor: 'text-[var(--terrace-night)]',
    glowColor: 'var(--terrace-copper)',
    title: 'En kort pause i frisk luft',
    description:
      'Noen ganger trenger man bare fem minutter ute, selv om det er kaldt. Perfekt for en rask pause med gløgg eller kaffe på vinteren.'
  }
]
