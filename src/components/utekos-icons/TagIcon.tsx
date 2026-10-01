import { ICON_COLORS, type IconProps } from './icon-types'

export function TagIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fillRule="evenodd" clipRule="evenodd" d="M21.5857 4C21.5857 2.89543 20.6903 2 19.5857 2H12.9999C12.4695 2 11.9608 2.21071 11.5857 2.58579L2.58569 11.5858C1.80465 12.3668 1.80464 13.6332 2.58569 14.4142L9.17148 21C9.95253 21.781 11.2189 21.781 11.9999 21L20.9999 12C21.375 11.6249 21.5857 11.1162 21.5857 10.5858V4ZM16.4998 9C15.6713 9 14.9998 8.32843 14.9998 7.5C14.9998 6.67157 15.6713 6 16.4998 6C17.3282 6 17.9998 6.67157 17.9998 7.5C17.9998 8.32843 17.3282 9 16.4998 9Z" fill="currentColor"/>
    </svg>
  )
}
