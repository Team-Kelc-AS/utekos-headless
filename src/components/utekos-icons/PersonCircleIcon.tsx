import { ICON_COLORS, type IconProps } from './icon-types'

export function PersonCircleIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" fillRule="evenodd" d="M4.876 17.5A8.985 8.985 0 0 0 12 21a8.98 8.98 0 0 0 7.124-3.5 8.988 8.988 0 0 0-3.68-2.815A9 9 0 0 0 4.876 17.5zM12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" clipRule="evenodd"/>
    </svg>
  )
}
