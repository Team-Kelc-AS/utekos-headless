import { ICON_COLORS, type IconProps } from './icon-types'

export function BankidIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M1 6a1 1 0 0 1 1-1h4a1 1 0 0 1 0 2H2a1 1 0 0 1-1-1m16 0a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1m-8 4a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1m8 0a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1M1 14a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H2a1 1 0 0 1-1-1m8 0a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1m-8 4a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H2a1 1 0 0 1-1-1m16 0a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1" clip-rule="evenodd"/>
    </svg>
  )
}
