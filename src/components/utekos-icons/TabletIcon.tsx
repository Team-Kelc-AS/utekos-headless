import { ICON_COLORS, type IconProps } from './icon-types'

export function TabletIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M4.5 3A3.5 3.5 0 0 0 1 6.5v11A3.5 3.5 0 0 0 4.5 21h15a3.5 3.5 0 0 0 3.5-3.5v-11A3.5 3.5 0 0 0 19.5 3zM20 5H4v14h16z" clip-rule="evenodd"/>
    </svg>
  )
}
