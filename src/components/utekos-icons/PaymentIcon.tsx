import { ICON_COLORS, type IconProps } from './icon-types'

export function PaymentIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M4.5 3A3.5 3.5 0 0 0 1 6.5V8h22V6.5A3.5 3.5 0 0 0 19.5 3zM1 17.5V11h22v6.5a3.5 3.5 0 0 1-3.5 3.5h-15A3.5 3.5 0 0 1 1 17.5M5 15a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1z" clip-rule="evenodd"/>
    </svg>
  )
}
