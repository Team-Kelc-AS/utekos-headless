import { ICON_COLORS, type IconProps } from './icon-types'

export function ArrowDownRightIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fillRule="evenodd" clipRule="evenodd" d="M19 5C19.5523 5 20 5.44772 20 6L20 19C20 19.5523 19.5523 20 19 20L6 20C5.44771 20 5 19.5523 5 19C5 18.4477 5.44771 18 6 18L16.5858 18L3.29289 4.70711C2.90237 4.31658 2.90237 3.68342 3.29289 3.29289C3.68342 2.90237 4.31658 2.90237 4.70711 3.29289L18 16.5858L18 6C18 5.44772 18.4477 5 19 5Z" fill="currentColor"/>
    </svg>
  )
}
