import { ICON_COLORS, type IconProps } from './icon-types'

export function DocIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M3 4.494A3.495 3.495 0 0 1 6.5 1H11v6.5a3.5 3.5 0 0 0 3.5 3.5H21v8.5a3.5 3.5 0 0 1-3.5 3.5h-11A3.497 3.497 0 0 1 3 19.503zM20.414 9 13 1.586V7.5A1.5 1.5 0 0 0 14.5 9z" clip-rule="evenodd"/>
    </svg>
  )
}
