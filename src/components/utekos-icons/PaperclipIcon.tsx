import { ICON_COLORS, type IconProps } from './icon-types'

export function PaperclipIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fillRule="evenodd" clipRule="evenodd" d="M5 6C5 3.23858 7.23858 1 10 1C12.7614 1 15 3.23858 15 6V15C15 16.6569 13.6569 18 12 18C10.3431 18 9 16.6569 9 15V9C9 8.44772 9.44772 8 10 8C10.5523 8 11 8.44772 11 9V15C11 15.5523 11.4477 16 12 16C12.5523 16 13 15.5523 13 15V6C13 4.34315 11.6569 3 10 3C8.34315 3 7 4.34315 7 6V16C7 18.7614 9.23858 21 12 21C14.7614 21 17 18.7614 17 16V9C17 8.44772 17.4477 8 18 8C18.5523 8 19 8.44772 19 9V16C19 19.866 15.866 23 12 23C8.13401 23 5 19.866 5 16V6Z" fill="currentColor"/>
    </svg>
  )
}
