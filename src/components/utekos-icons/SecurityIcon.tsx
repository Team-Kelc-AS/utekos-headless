import { ICON_COLORS, type IconProps } from './icon-types'

export function SecurityIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M8 7a4 4 0 1 1 8 0v2H8zM6 9V7a6 6 0 1 1 12 0v2a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3m8 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0" clip-rule="evenodd"/>
    </svg>
  )
}
