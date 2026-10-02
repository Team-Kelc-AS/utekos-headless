import { ICON_COLORS, type IconProps } from './icon-types'

export function DragIndicatorIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M8.5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-2 9a2 2 0 1 1 4 0 2 2 0 0 1-4 0m0 7a2 2 0 1 1 4 0 2 2 0 0 1-4 0m9-16a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-2 9a2 2 0 1 1 4 0 2 2 0 0 1-4 0m0 7a2 2 0 1 1 4 0 2 2 0 0 1-4 0" clip-rule="evenodd"/>
    </svg>
  )
}
