import { ICON_COLORS, type IconProps } from './icon-types'

export function PinIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M7.158 2.25A1 1 0 0 1 8.126 1h7.748a1 1 0 0 1 .968 1.25 5 5 0 0 1-1.458 2.43A1.126 1.126 0 0 0 15 5.5v3.448c0 .401.242.758.596.946a7.7 7.7 0 0 1 3.322 3.464c.311.65.198 1.342-.166 1.845a1.953 1.953 0 0 1-1.585.797H13v4.764a1 1 0 0 1-.106.447l-.715 1.431a.2.2 0 0 1-.358 0l-.715-1.43a.999.999 0 0 1-.106-.448V16H6.833c-.646 0-1.23-.308-1.585-.797a1.793 1.793 0 0 1-.165-1.845 7.7 7.7 0 0 1 3.32-3.464C8.759 9.706 9 9.35 9 8.948V5.5c0-.315-.152-.606-.384-.819a5 5 0 0 1-1.458-2.432z" clipRule="evenodd"/>
    </svg>
  )
}
