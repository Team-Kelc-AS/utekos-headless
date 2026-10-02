import { ICON_COLORS, type IconProps } from './icon-types'

export function ArrowLeftIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M2.293 12.707a1 1 0 0 1 0-1.414l8-8a1 1 0 1 1 1.414 1.414L5.414 11H21a1 1 0 1 1 0 2H5.414l6.293 6.293a1 1 0 0 1-1.414 1.414z" clip-rule="evenodd"/>
    </svg>
  )
}
