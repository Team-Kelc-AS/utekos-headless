import { ICON_COLORS, type IconProps } from './icon-types'

export function ArrowUpLeftIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fillRule="evenodd" clipRule="evenodd" d="M5 19C4.44772 19 4 18.5523 4 18L4 5C4 4.44771 4.44771 4 5 4L18 4C18.5523 4 19 4.44771 19 5C19 5.55228 18.5523 6 18 6L7.41421 6L20.7071 19.2929C21.0976 19.6834 21.0976 20.3166 20.7071 20.7071C20.3166 21.0976 19.6834 21.0976 19.2929 20.7071L6 7.41421L6 18C6 18.5523 5.55228 19 5 19Z" fill="currentColor"/>
    </svg>
  )
}
