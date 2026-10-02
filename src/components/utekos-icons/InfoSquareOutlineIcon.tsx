import { ICON_COLORS, type IconProps } from './icon-types'

export function InfoSquareOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M5.5 2A3.5 3.5 0 0 0 2 5.5v13A3.5 3.5 0 0 0 5.5 22h13a3.5 3.5 0 0 0 3.5-3.5v-13A3.5 3.5 0 0 0 18.5 2zM4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5zm6.5 2.25a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0m.5 4a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0z" clip-rule="evenodd"/>
    </svg>
  )
}
