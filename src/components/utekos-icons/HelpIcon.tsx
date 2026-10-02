import { ICON_COLORS, type IconProps } from './icon-types'

export function HelpIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1 1 5.925 1 12s4.925 11 11 11m0-6a5 5 0 1 0 0-10 5 5 0 0 0 0 10M11 4a1 1 0 0 1 1-1 9 9 0 0 1 9 9 1 1 0 1 1-2 0 7 7 0 0 0-7-7 1 1 0 0 1-1-1m1 17a1 1 0 1 0 0-2 7 7 0 0 1-7-7 1 1 0 1 0-2 0 9 9 0 0 0 9 9" clip-rule="evenodd"/>
    </svg>
  )
}
