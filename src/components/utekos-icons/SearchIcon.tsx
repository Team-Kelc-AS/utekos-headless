import { ICON_COLORS, type IconProps } from './icon-types'

export function SearchIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M3 9.5a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0zM9.5 1a8.5 8.5 0 1 0 5.262 15.176l5.53 5.531a1 1 0 0 0 1.415-1.414l-5.531-5.531A8.5 8.5 0 0 0 9.5 1z" clipRule="evenodd"/>
    </svg>
  )
}
