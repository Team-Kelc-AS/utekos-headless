import { ICON_COLORS, type IconProps } from './icon-types'

export function CashierMachineOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M6 0a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h1v1H4.802A2 2 0 0 0 2.85 7.566l-1.826 8.217L1 15.89V20a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-4.11l-.024-.107-1.826-8.217A2 2 0 0 0 19.198 6H19V4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2H9V5h1a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H6zm0 2h4v1H6V2zm11 4h-2V4h2v2zM4.802 8h14.396l1.555 7H3.247l1.555-7zM21 20v-3H3v3h18zM6.5 10a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1zm5-1a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2h-1zm-3 4a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1zm7-4a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2h-1zm-3 4a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1z" clipRule="evenodd"/>
    </svg>
  )
}
