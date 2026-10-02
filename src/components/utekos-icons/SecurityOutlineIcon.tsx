import { ICON_COLORS, type IconProps } from './icon-types'

export function SecurityOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M8 7a4 4 0 1 1 8 0v2H8zM6 9.126V7a6 6 0 1 1 12 0v2.126c1.725.444 3 2.01 3 3.874v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-6a4 4 0 0 1 3-3.874M17 11H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2m-3 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0" clip-rule="evenodd"/>
    </svg>
  )
}
