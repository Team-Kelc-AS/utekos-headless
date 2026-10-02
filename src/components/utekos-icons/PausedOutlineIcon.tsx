import { ICON_COLORS, type IconProps } from './icon-types'

export function PausedOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1 1 5.925 1 12s4.925 11 11 11m0-2a9 9 0 1 0 0-18 9 9 0 0 0 0 18M9.5 7a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1m6 1a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0z" clip-rule="evenodd"/>
    </svg>
  )
}
