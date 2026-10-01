import type { SVGProps } from 'react'

export const ICON_COLORS = {
  orange: '#b44701',
  light: '#f0eee9',
} as const

export type IconTone = keyof typeof ICON_COLORS

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'color' | 'width' | 'height'> & {
  /** Only the two approved Utekos icon colors are exposed. */
  tone?: IconTone
  /** Width and height in CSS/React units. Defaults to 24. */
  size?: number | string
  /** Optional accessible title. Decorative icons are aria-hidden by default. */
  title?: string
}
