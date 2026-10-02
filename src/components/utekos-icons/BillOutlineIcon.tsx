import { ICON_COLORS, type IconProps } from './icon-types'

export function BillOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M6.5 1A3.5 3.5 0 0 0 3 4.5v15A3.5 3.5 0 0 0 6.5 23h11a3.5 3.5 0 0 0 3.5-3.5v-15A3.5 3.5 0 0 0 17.5 1zM5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5zm7 5.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5m4 3a1 1 0 0 1-1 1H9a1 1 0 1 1 0-2h6a1 1 0 0 1 1 1m-1 5a1 1 0 1 0 0-2H9a1 1 0 1 0 0 2z" clip-rule="evenodd"/>
    </svg>
  )
}
