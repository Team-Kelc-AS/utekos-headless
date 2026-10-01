import { ICON_COLORS, type IconProps } from './icon-types'

export function ArrowUpRightIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fillRule="evenodd" clipRule="evenodd" d="M5 5C5 4.44772 5.44772 4 6 4H19C19.5523 4 20 4.44772 20 5V18C20 18.5523 19.5523 19 19 19C18.4477 19 18 18.5523 18 18V7.41421L4.70711 20.7071C4.31658 21.0976 3.68342 21.0976 3.29289 20.7071C2.90237 20.3166 2.90237 19.6834 3.29289 19.2929L16.5858 6H6C5.44772 6 5 5.55228 5 5Z" fill="currentColor"/>
    </svg>
  )
}
