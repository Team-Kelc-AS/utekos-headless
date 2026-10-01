import { ICON_COLORS, type IconProps } from './icon-types'

export function RecurringIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 10.5L4.5 7m0 0L8 10.5M4.5 7v7a6 6 0 0 0 6 6h3m9.5-6.5L19.5 17m0 0L16 13.5m3.5 3.5v-7a6 6 0 0 0-6-6h-3"/>
    </svg>
  )
}
