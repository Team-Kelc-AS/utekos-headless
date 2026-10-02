import { ICON_COLORS, type IconProps } from './icon-types'

export function BillIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M6.5 1A3.5 3.5 0 0 0 3 4.5v15A3.5 3.5 0 0 0 6.5 23h11a3.5 3.5 0 0 0 3.5-3.5v-15A3.5 3.5 0 0 0 17.5 1zm5.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5m4 5a1 1 0 1 0 0-2H8a1 1 0 1 0 0 2zm1 3a1 1 0 0 1-1 1H8a1 1 0 1 1 0-2h8a1 1 0 0 1 1 1" clip-rule="evenodd"/>
    </svg>
  )
}
