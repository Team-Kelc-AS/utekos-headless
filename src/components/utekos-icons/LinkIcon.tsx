import { ICON_COLORS, type IconProps } from './icon-types'

export function LinkIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M5.636 18.364a4 4 0 0 1 0-5.657l.354-.354a1 1 0 1 0-1.415-1.414l-.353.354a6 6 0 1 0 8.485 8.485l1.768-1.768a6 6 0 0 0-.933-9.248 1 1 0 1 0-1.104 1.668 4 4 0 0 1 .623 6.167l-1.768 1.767a4 4 0 0 1-5.657 0zM18.364 5.636a4 4 0 0 1 0 5.657l-.354.353a1 1 0 0 0 1.415 1.415l.353-.354a6 6 0 0 0-8.485-8.485L9.525 5.99a6 6 0 0 0 .933 9.248 1 1 0 1 0 1.104-1.668 4 4 0 0 1-.623-6.167l1.768-1.767a4 4 0 0 1 5.657 0z" clipRule="evenodd"/>
    </svg>
  )
}
