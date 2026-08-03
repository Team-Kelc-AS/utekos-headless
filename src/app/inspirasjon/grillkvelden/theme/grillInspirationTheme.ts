/**
 * Grillkvelden — kort, faner og CTA (samme palett som UseCasesGrid / HostTips).
 *
 * Kort: demitasse · ikonbakgrunn: amphora · ikon/aktiv tekst: almost-mauve
 */
export const grillSeasonsCardTheme = {
  tabTriggerClassName:
    'border-foreground bg-demitasse text-foreground hover:border-foreground hover:bg-demitasse/90 data-active:border-foreground data-active:bg-demitasse data-active:text-foreground',
  tabActiveClassName: 'text-foreground',
  tabInactiveClassName: 'text-foreground',
  contentCardClassName: 'border-foreground/18 bg-jungle',
  contentIconClassName:
    'border-foreground/18 bg-dark-teal text-foreground',
  contentIconGlyphClassName: 'text-foreground',
  contentTitleClassName: 'text-foreground',
  contentTextClassName: 'text-foreground'
} as const

/** Matcher GrillHeroSection-knappene — ingen gradient på seksjonsbakgrunn. */
export const grillCtaTheme = {
  showAccentGlow: false,
  primaryButtonBg: 'var(--primary)',
  primaryButtonText: 'var(--primary-foreground)',
  secondaryButtonBg: 'var(--card)',
  secondaryButtonText: 'var(--card-foreground)',
  primaryButtonClassName:
    'group min-h-14 border-none px-8 py-4 text-base leading-4 font-google-sans font-bold tracking-normal shadow-[0_18px_38px_-28px_color-mix(in_oklch,var(--primary)_72%,transparent)] transition-transform duration-300 hover:-translate-y-0.5 hover:brightness-105',
  secondaryButtonClassName:
    'min-h-14 border border-card-foreground/24 dark:border-dark-card-foreground/24 px-8 py-4 text-base leading-4 font-google-sans font-bold tracking-normal shadow-[0_18px_38px_-30px_color-mix(in_oklch,var(--background)_48%,transparent)] transition-transform duration-300 hover:-translate-y-0.5 hover:bg-card/90 /90'
} as const
