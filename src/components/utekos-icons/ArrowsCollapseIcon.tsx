import { ICON_COLORS, type IconProps } from './icon-types'

export function ArrowsCollapseIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fillRule="evenodd" clipRule="evenodd" d="M2.29289 21.7071C1.90237 21.3166 1.90237 20.6834 2.29289 20.2929L7.58579 15H3C2.44772 15 2 14.5523 2 14C2 13.4477 2.44772 13 3 13H10C10.5523 13 11 13.4477 11 14V21C11 21.5523 10.5523 22 10 22C9.44772 22 9 21.5523 9 21V16.4142L3.70711 21.7071C3.31658 22.0976 2.68342 22.0976 2.29289 21.7071ZM13 10V3C13 2.44772 13.4477 2 14 2C14.5523 2 15 2.44772 15 3V7.58579L20.2929 2.29289C20.6834 1.90237 21.3166 1.90237 21.7071 2.29289C22.0976 2.68342 22.0976 3.31658 21.7071 3.70711L16.4142 9H21C21.5523 9 22 9.44771 22 10C22 10.5523 21.5523 11 21 11H14C13.4477 11 13 10.5523 13 10Z" fill="currentColor"/>
    </svg>
  )
}
