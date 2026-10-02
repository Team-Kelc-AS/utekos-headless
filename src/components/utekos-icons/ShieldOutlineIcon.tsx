import { ICON_COLORS, type IconProps } from './icon-types'

export function ShieldOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M11.298 1.195a2 2 0 0 1 1.404 0l7 2.625A2 2 0 0 1 21 5.693v7.982a7 7 0 0 1-3.29 5.935l-4.65 2.907a2 2 0 0 1-2.12 0L6.29 19.61A7 7 0 0 1 3 13.675V5.692A2 2 0 0 1 4.298 3.82zM19 5.693l-7-2.625-7 2.625v7.982a5 5 0 0 0 2.35 4.24L12 20.82l4.65-2.907a5 5 0 0 0 2.35-4.24V5.694z" clip-rule="evenodd"/>
    </svg>
  )
}
