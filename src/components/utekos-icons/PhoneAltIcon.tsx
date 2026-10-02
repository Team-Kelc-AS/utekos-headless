import { ICON_COLORS, type IconProps } from './icon-types'

export function PhoneAltIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" fill-rule="evenodd" d="M3.25 2.75C3.25 1.784 4.034 1 5 1h6c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 11 15H5a1.75 1.75 0 0 1-1.75-1.75zM4.75 12V4h6.5v8z" clip-rule="evenodd"/>
    </svg>
  )
}
