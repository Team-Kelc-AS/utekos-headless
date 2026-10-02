import { ICON_COLORS, type IconProps } from './icon-types'

export function EmailIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M1.403 4.868A3.5 3.5 0 0 1 4.5 3h15a3.5 3.5 0 0 1 3.097 1.868l-9.637 8.03a1.5 1.5 0 0 1-1.92 0zM1 7.135V17.5A3.5 3.5 0 0 0 4.5 21h15a3.5 3.5 0 0 0 3.5-3.5V7.135l-8.76 7.3a3.5 3.5 0 0 1-4.48 0z" clip-rule="evenodd"/>
    </svg>
  )
}
