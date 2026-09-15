import type { CSSProperties } from 'react'
import type { MagazineArticle } from '../types'

/**
 * Accent / on-accent pairs verified for WCAG 2.2 AA (≥4.5:1) against
 * current Magasinet tokens (`--background` dark text, `--foreground` light text).
 */
const accentThemeByName = {
  'ancient-water': {
    accent: 'var(--ancient-water)',
    accentForeground: 'var(--background)'
  },
  'bleached-mauve': {
    accent: 'var(--fair-orchid)',
    accentForeground: 'var(--background)'
  },
  'very-peri': {
    accent: 'var(--very-peri)',
    accentForeground: 'var(--foreground)'
  },
  'mountain-view': {
    accent: 'var(--mountain-view)',
    accentForeground: 'var(--foreground)'
  },
  overcast: {
    accent: 'var(--overcast)',
    accentForeground: 'var(--background)'
  },
  primary: {
    accent: 'var(--primary)',
    accentForeground: 'var(--primary-foreground)'
  }
} satisfies Record<
  MagazineArticle['theme']['accent'],
  { accent: string; accentForeground: string }
>

export function getMagazineThemeStyle(
  theme: MagazineArticle['theme']
): CSSProperties {
  const tokens = accentThemeByName[theme.accent]

  return {
    '--magazine-accent': tokens.accent,
    '--magazine-accent-foreground': tokens.accentForeground
  } as CSSProperties
}
