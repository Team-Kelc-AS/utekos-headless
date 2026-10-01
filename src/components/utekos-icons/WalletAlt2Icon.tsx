import { ICON_COLORS, type IconProps } from './icon-types'

export function WalletAlt2Icon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M2 5.5A3.5 3.5 0 0 1 5.5 2h13A3.5 3.5 0 0 1 22 5.5v13a3.5 3.5 0 0 1-3.5 3.5h-13A3.5 3.5 0 0 1 2 18.5v-13zm2 0A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v2H4v-2zm0 5A1.5 1.5 0 0 1 5.5 9h13a1.5 1.5 0 0 1 1.5 1.5v2h-5a3 3 0 1 1-6 0H4v-2z" clipRule="evenodd"/>
    </svg>
  )
}
