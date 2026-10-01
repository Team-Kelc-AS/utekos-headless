import { ICON_COLORS, type IconProps } from './icon-types'

export function TrayIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fillRule="evenodd" clipRule="evenodd" d="M4.42578 4.55855C5.07491 3.58485 6.16772 3 7.33796 3H16.662C17.8323 3 18.9251 3.58485 19.5742 4.55855L22.4122 8.81549C22.7955 9.39043 23 10.066 23 10.7569V11V17.5C23 19.433 21.433 21 19.5 21H4.5C2.567 21 1 19.433 1 17.5V11V10.7569C1 10.066 1.20453 9.39042 1.58782 8.81549L4.42578 4.55855ZM20.7481 9.92489C20.7645 9.94951 20.7801 9.97456 20.795 10H16C15.4477 10 15 10.4477 15 11C15 12.6569 13.6569 14 12 14C10.3431 14 9 12.6569 9 11C9 10.4477 8.55228 10 8 10H3.20499C3.21986 9.97456 3.23551 9.94951 3.25192 9.92489L6.08988 5.66795C6.36808 5.25065 6.83643 5 7.33796 5H16.662C17.1636 5 17.6319 5.25065 17.9101 5.66795L20.7481 9.92489Z" fill="currentColor"/>
    </svg>
  )
}
