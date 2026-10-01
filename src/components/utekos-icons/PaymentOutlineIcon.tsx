import { ICON_COLORS, type IconProps } from './icon-types'

export function PaymentOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" fillRule="evenodd" d="M1 6.5A3.5 3.5 0 0 1 4.5 3h15A3.5 3.5 0 0 1 23 6.5v11a3.5 3.5 0 0 1-3.5 3.5h-15A3.5 3.5 0 0 1 1 17.5v-11zM4.5 5A1.5 1.5 0 0 0 3 6.5V8h18V6.5A1.5 1.5 0 0 0 19.5 5h-15zM3 17.5V11h18v6.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zM6 14a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H6z" clipRule="evenodd"/>
    </svg>
  )
}
