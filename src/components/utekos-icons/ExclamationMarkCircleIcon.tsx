import { ICON_COLORS, type IconProps } from './icon-types'

export function ExclamationMarkCircleIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fillRule="evenodd" clipRule="evenodd" d="M1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12ZM10.7946 7.74921C10.7702 7.06662 11.317 6.5 12 6.5C12.683 6.5 13.2298 7.06662 13.2054 7.7492L13.0357 12.5006C13.0158 13.0582 12.558 13.5 12 13.5C11.442 13.5 10.9842 13.0582 10.9643 12.5006L10.7946 7.74921ZM10.5 16C10.5 15.1716 11.1716 14.5 12 14.5C12.8284 14.5 13.5 15.1716 13.5 16C13.5 16.8284 12.8284 17.5 12 17.5C11.1716 17.5 10.5 16.8284 10.5 16Z" fill="currentColor"/>
    </svg>
  )
}
