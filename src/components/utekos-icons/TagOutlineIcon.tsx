import { ICON_COLORS, type IconProps } from './icon-types'

export function TagOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fillRule="evenodd" clipRule="evenodd" d="M19.5857 2C20.6903 2 21.5857 2.89543 21.5857 4V10.5858C21.5857 11.1162 21.375 11.6249 20.9999 12L11.9999 21C11.2189 21.781 9.95253 21.781 9.17148 21L2.58569 14.4142C1.80464 13.6332 1.80465 12.3668 2.58569 11.5858L11.5857 2.58579C11.9608 2.21071 12.4695 2 12.9999 2H19.5857ZM19.5857 4H12.9999L3.99991 13L10.5857 19.5858L19.5857 10.5858V4ZM16.0857 9C15.2573 9 14.5857 8.32843 14.5857 7.5C14.5857 6.67157 15.2573 6 16.0857 6C16.9141 6 17.5857 6.67157 17.5857 7.5C17.5857 8.32843 16.9141 9 16.0857 9Z" fill="currentColor"/>
    </svg>
  )
}
