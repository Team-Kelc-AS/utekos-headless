import { ICON_COLORS, type IconProps } from './icon-types'

export function PhoneIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M5 4.5A3.5 3.5 0 0 1 8.5 1h7A3.5 3.5 0 0 1 19 4.5v15a3.5 3.5 0 0 1-3.5 3.5h-7A3.5 3.5 0 0 1 5 19.5zM17 5H7v14h10z" clip-rule="evenodd"/>
    </svg>
  )
}
