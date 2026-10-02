import { ICON_COLORS, type IconProps } from './icon-types'

export function DocPlainTextOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M5 4.494C5 3.67 5.669 3 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11c-.83 0-1.5-.67-1.5-1.497zM6.5 1C4.57 1 3 2.558 3 4.494v15.009A3.497 3.497 0 0 0 6.5 23h11a3.5 3.5 0 0 0 3.5-3.5v-15A3.5 3.5 0 0 0 17.5 1zM15 8a1 1 0 1 0 0-2H9a1 1 0 1 0 0 2zm1 3a1 1 0 0 1-1 1H9a1 1 0 1 1 0-2h6a1 1 0 0 1 1 1m-4 5a1 1 0 1 0 0-2H9a1 1 0 1 0 0 2z" clip-rule="evenodd"/>
    </svg>
  )
}
