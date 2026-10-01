import { ICON_COLORS, type IconProps } from './icon-types'

export function PlusIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      
<path fillRule="evenodd" clipRule="evenodd" d="M12 3C11.1716 3 10.5 3.67157 10.5 4.5V10.5H4.5C3.67157 10.5 3 11.1716 3 12C3 12.8284 3.67157 13.5 4.5 13.5H10.5V19.5C10.5 20.3284 11.1716 21 12 21C12.8284 21 13.5 20.3284 13.5 19.5V13.5H19.5C20.3284 13.5 21 12.8284 21 12C21 11.1716 20.3284 10.5 19.5 10.5H13.5V4.5C13.5 3.67157 12.8284 3 12 3Z" fill="currentColor"/>

    </svg>
  )
}
