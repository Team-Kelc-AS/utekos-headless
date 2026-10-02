import { ICON_COLORS, type IconProps } from './icon-types'

export function SocialSecurityIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M6.5 1A3.5 3.5 0 0 0 3 4.5v15A3.5 3.5 0 0 0 6.5 23h11a3.5 3.5 0 0 0 3.5-3.5v-15A3.5 3.5 0 0 0 17.5 1zM15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0m1 8a1 1 0 0 1-1 1H9a1 1 0 1 1 0-2h6a1 1 0 0 1 1 1" clip-rule="evenodd"/>
    </svg>
  )
}
