import { ICON_COLORS, type IconProps } from './icon-types'

export function BookmarkOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" d="M5 21V5q0-.824.588-1.412A1.93 1.93 0 0 1 7 3h10q.824 0 1.413.587Q19 4.176 19 5v16l-7-3zm2-3.05 5-2.15 5 2.15V5H7z"/>
    </svg>
  )
}
