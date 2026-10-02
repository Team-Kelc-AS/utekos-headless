import { ICON_COLORS, type IconProps } from './icon-types'

export function KeyOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <g clip-path="url(#a)"><path fill="currentColor" fill-rule="evenodd" d="M3 12a4 4 0 0 1 7.668-1.6l.262.6H21v2h-2v2h-2v-2h-6.07l-.262.6A4.001 4.001 0 0 1 3 12m18 4v-1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-8.803a6 6 0 1 0 0 6H15v2h6zM7 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4" clip-rule="evenodd"/></g><defs><clipPath id="a"><path fill="currentColor" d="M0 0h24v24H0z"/></clipPath></defs>
    </svg>
  )
}
