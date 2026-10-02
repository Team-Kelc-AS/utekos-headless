import { ICON_COLORS, type IconProps } from './icon-types'

export function NutIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M7.577 2.34a2 2 0 0 0-1.732 1L1.423 11a2 2 0 0 0 0 2l.866-.5-.866.5 4.422 7.66a2 2 0 0 0 1.732 1h8.846a2 2 0 0 0 1.732-1L22.577 13a2 2 0 0 0 0-2l-4.422-7.66a2 2 0 0 0-1.732-1zM8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0" clip-rule="evenodd"/>
    </svg>
  )
}
