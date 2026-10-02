import { ICON_COLORS, type IconProps } from './icon-types'

export function BookmarkIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" d="M5 5v16l7-3 7 3V5q0-.824-.587-1.412A1.93 1.93 0 0 0 17 3H7q-.824 0-1.412.587A1.93 1.93 0 0 0 5 5"/>
    </svg>
  )
}
