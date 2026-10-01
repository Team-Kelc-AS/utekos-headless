import { ICON_COLORS, type IconProps } from './icon-types'

export function LineHorizontal2Icon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      
<path fillRule="evenodd" clipRule="evenodd" d="M5 9C4.44772 9 4 9.44772 4 10C4 10.5523 4.44772 11 5 11H19C19.5523 11 20 10.5523 20 10C20 9.44772 19.5523 9 19 9H5ZM5 13C4.44772 13 4 13.4477 4 14C4 14.5523 4.44772 15 5 15H19C19.5523 15 20 14.5523 20 14C20 13.4477 19.5523 13 19 13H5Z" fill="currentColor"/>

    </svg>
  )
}
