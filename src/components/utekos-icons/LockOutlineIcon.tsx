import { ICON_COLORS, type IconProps } from './icon-types'

export function LockOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M12 1a6 6 0 0 0-6 6v2.126C4.275 9.57 3 11.136 3 13v6a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4v-6a4 4 0 0 0-3-3.874V7a6 6 0 0 0-6-6m4 6a4 4 0 0 0-8 0v2h8zm-9 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2zm7 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0" clip-rule="evenodd"/>
    </svg>
  )
}
