/**
 * Breadcrumb surface tokens — WCAG 2.2 AAA-oriented pairs.
 *
 * Verified pairs (approximate, from design tokens):
 * - light:    fg #f0eee9 on bg #010214  → ~15.8:1 (1.4.3 AAA)
 * - dark:     fg #f0eee9 on bg #010214  → ~15.8:1 (1.4.3 AAA)
 * - inverted: fg #010214 on bg #f0eee9  → ~15.8:1 (1.4.3 AAA)
 * - transparent: inherits parent `color`; contrast is the parent’s responsibility.
 *
 * Link opacities use /85 (not /72) to preserve ≥7:1 on muted states.
 * Separators use /55 — non-text UI, ≥3:1 vs adjacent (1.4.11 AA).
 * light surface hover uses ceramic (not primary): primary on dark bg ≈3.85:1 (fails 1.4.3 normal text).
 */

export type BreadcrumbSurface =
  | 'light'
  | 'dark'
  | 'inverted'
  | 'transparent'
  | 'transparentDark'
  | 'embeddedLight'
  | 'embeddedDark'

export type BreadcrumbNavItem = { label: string; href?: string }

export type BreadcrumbSurfaceStyles = {
  stripe: string
  list: string
  link: string
  page: string
  separator: string
}

const lightText: BreadcrumbSurfaceStyles = {
  stripe:
    'border-b border-border  bg-background text-foreground',
  list: 'text-foreground',
  link: 'text-foreground/85 transition-colors hover:text-ceramic focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceramic/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  page: 'font-medium text-foreground',
  separator:
    'text-foreground/55 [&>svg]:text-foreground/55'
}

const darkText: BreadcrumbSurfaceStyles = {
  stripe:
    'border-b border-background/12 bg-foreground text-background',
  list: 'text-background',
  link: 'text-background/85 transition-colors hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/50 focus-visible:ring-offset-2 focus-visible:ring-offset-foreground',
  page: 'font-medium text-background',
  separator:
    'text-background/55 [&>svg]:text-background/55'
}

const invertedText: BreadcrumbSurfaceStyles = {
  stripe:
    'border-b border-background/12 bg-foreground text-background',
  list: 'text-background',
  link: 'text-background/85 transition-colors hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background/50 focus-visible:ring-offset-2 focus-visible:ring-offset-foreground',
  page: 'font-medium text-background',
  separator:
    'text-background/55 [&>svg]:text-background/55'
}

const transparentText: BreadcrumbSurfaceStyles = {
  stripe: '',
  list: 'text-inherit',
  link: 'text-inherit/85 transition-colors hover:text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50 focus-visible:ring-offset-2',
  page: 'font-medium text-inherit',
  separator: 'text-inherit/55 [&>svg]:text-inherit/55'
}

export const breadcrumbSurfaceStyles: Record<
  BreadcrumbSurface,
  BreadcrumbSurfaceStyles
> = {
  light: lightText,
  dark: darkText,
  inverted: invertedText,
  transparent: transparentText,
  /** @deprecated Use `transparent` — kept for backward compatibility. */
  transparentDark: transparentText,
  /** @deprecated Use `transparent` with parent text color. */
  embeddedLight: { ...lightText, stripe: '' },
  /** @deprecated Use `transparent` with parent text color. */
  embeddedDark: { ...darkText, stripe: '' }
}

export function isEmbeddedSurface(
  surface: BreadcrumbSurface
): boolean {
  return breadcrumbSurfaceStyles[surface].stripe === ''
}
