import { ICON_COLORS, type IconProps } from './icon-types'

export function TrayOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M7.338 3a3.5 3.5 0 0 0-2.912 1.559L1.588 8.815A3.5 3.5 0 0 0 1 10.757V17.5A3.5 3.5 0 0 0 4.5 21h15a3.5 3.5 0 0 0 3.5-3.5v-6.743a3.5 3.5 0 0 0-.588-1.942L19.574 4.56A3.5 3.5 0 0 0 16.662 3H7.338zm13.457 7a1.532 1.532 0 0 0-.047-.075L17.91 5.668A1.5 1.5 0 0 0 16.662 5H7.338a1.5 1.5 0 0 0-1.248.668L3.252 9.925 3.205 10H8a1 1 0 0 1 1 1 3 3 0 1 0 6 0 1 1 0 0 1 1-1h4.795zM3 12v5.5A1.5 1.5 0 0 0 4.5 19h15a1.5 1.5 0 0 0 1.5-1.5V12h-4.1a5.002 5.002 0 0 1-9.8 0H3z" clipRule="evenodd"/>
    </svg>
  )
}
