import { ICON_COLORS, type IconProps } from './icon-types'

export function PaymentHistoryIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M1 4.75A2.75 2.75 0 0 1 3.75 2h16.5A2.75 2.75 0 0 1 23 4.75V5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-.25zM3 8a1 1 0 0 0-1 1v9.5A3.5 3.5 0 0 0 5.5 22h13a3.5 3.5 0 0 0 3.5-3.5V9a1 1 0 0 0-1-1H3zm4.887 2.785a1 1 0 0 1 1.26.642 3 3 0 0 0 5.706 0 1 1 0 1 1 1.902.618 5 5 0 0 1-9.51 0 1 1 0 0 1 .642-1.26z" clipRule="evenodd"/>
    </svg>
  )
}
