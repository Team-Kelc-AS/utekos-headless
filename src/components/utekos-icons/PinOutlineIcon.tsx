import { ICON_COLORS, type IconProps } from './icon-types'

export function PinOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M9.563 4.25A4.362 4.362 0 0 1 8.348 3h7.304c-.316.494-.73.92-1.215 1.25L14 4.549v4.715A7.675 7.675 0 0 0 12 9c-.692 0-1.363.092-2 .264V4.548l-.437-.298zM16 5.577v4.548a7.7 7.7 0 0 1 2.918 3.233c.311.65.198 1.342-.166 1.845a1.953 1.953 0 0 1-1.585.797H13v4.764a.999.999 0 0 1-.106.447l-.715 1.431a.2.2 0 0 1-.358 0l-.715-1.43a.999.999 0 0 1-.106-.448V16H6.833c-.646 0-1.23-.308-1.585-.797a1.793 1.793 0 0 1-.165-1.845A7.7 7.7 0 0 1 8 10.125V5.577a6.357 6.357 0 0 1-1.575-1.904 1.752 1.752 0 0 1 .114-1.87A1.94 1.94 0 0 1 8.125 1h7.75c.646 0 1.234.308 1.587.803.365.514.464 1.222.113 1.87A6.357 6.357 0 0 1 16 5.577zM12 14h5.002A5.666 5.666 0 0 0 12 11a5.666 5.666 0 0 0-5 3h5z" clipRule="evenodd"/>
    </svg>
  )
}
