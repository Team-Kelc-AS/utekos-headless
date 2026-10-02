import { ICON_COLORS, type IconProps } from './icon-types'

export function SimcardOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M5 4.494C5 3.67 5.669 3 6.5 3h6.443a1.5 1.5 0 0 1 1.076.455l4.557 4.696A1.5 1.5 0 0 1 19 9.196V19.5a1.5 1.5 0 0 1-1.5 1.5h-11c-.83 0-1.5-.67-1.5-1.497zM6.5 1C4.57 1 3 2.558 3 4.494v15.009A3.497 3.497 0 0 0 6.5 23h11a3.5 3.5 0 0 0 3.5-3.5V9.196a3.5 3.5 0 0 0-.988-2.438l-4.558-4.696A3.5 3.5 0 0 0 12.943 1zM8 13a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1z" clip-rule="evenodd"/>
    </svg>
  )
}
