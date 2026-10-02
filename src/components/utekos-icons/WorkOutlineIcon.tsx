import { ICON_COLORS, type IconProps } from './icon-types'

export function WorkOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M10 2a2 2 0 0 0-2 2v2H5.5A3.5 3.5 0 0 0 2 9.5v9A3.5 3.5 0 0 0 5.5 22h13a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 18.5 6H16V4a2 2 0 0 0-2-2zm4 4V4h-4v2zM8 8H5.5A1.5 1.5 0 0 0 4 9.5v9A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 18.5 8z" clip-rule="evenodd"/>
    </svg>
  )
}
