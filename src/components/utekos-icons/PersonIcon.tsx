import { ICON_COLORS, type IconProps } from './icon-types'

export function PersonIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" d="M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3.278 20.026C2.974 21.088 3.895 22 5 22h14c1.105 0 2.026-.912 1.722-1.974a7.4 7.4 0 0 0-.407-1.087 8.008 8.008 0 0 0-1.951-2.596 9.147 9.147 0 0 0-2.92-1.734A9.983 9.983 0 0 0 12 14a9.983 9.983 0 0 0-3.444.609 9.148 9.148 0 0 0-2.92 1.734 8.009 8.009 0 0 0-1.95 2.596 7.283 7.283 0 0 0-.408 1.087z"/><path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M12 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3.278 20.026C2.974 21.088 3.895 22 5 22h14c1.105 0 2.026-.912 1.722-1.974a7.4 7.4 0 0 0-.407-1.087 8.008 8.008 0 0 0-1.951-2.596 9.147 9.147 0 0 0-2.92-1.734A9.983 9.983 0 0 0 12 14a9.983 9.983 0 0 0-3.444.609 9.148 9.148 0 0 0-2.92 1.734 8.009 8.009 0 0 0-1.95 2.596 7.283 7.283 0 0 0-.408 1.087z"/>
    </svg>
  )
}
