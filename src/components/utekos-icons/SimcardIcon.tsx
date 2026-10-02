import { ICON_COLORS, type IconProps } from './icon-types'

export function SimcardIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M17.5 23a3.5 3.5 0 0 0 3.5-3.5V9.095a3.5 3.5 0 0 0-1.126-2.572l-4.977-4.595A3.5 3.5 0 0 0 12.522 1H6.5A3.5 3.5 0 0 0 3 4.5v15A3.5 3.5 0 0 0 6.5 23zM8 13a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1z" clip-rule="evenodd"/>
    </svg>
  )
}
