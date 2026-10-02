import { ICON_COLORS, type IconProps } from './icon-types'

export function LockOpenIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M11.217 1.051a6 6 0 0 1 6.579 4.396 1 1 0 0 1-1.932.518A4 4 0 0 0 8 7v2h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3V7a6 6 0 0 1 5.217-5.949M12 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4" clip-rule="evenodd"/>
    </svg>
  )
}
