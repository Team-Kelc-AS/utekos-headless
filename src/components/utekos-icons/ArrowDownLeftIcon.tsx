import { ICON_COLORS, type IconProps } from './icon-types'

export function ArrowDownLeftIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fillRule="evenodd" clipRule="evenodd" d="M19 19C19 19.5523 18.5523 20 18 20L5 20C4.44771 20 4 19.5523 4 19L4 6C4 5.44771 4.44772 5 5 5C5.55229 5 6 5.44771 6 6L6 16.5858L19.2929 3.29289C19.6834 2.90237 20.3166 2.90237 20.7071 3.29289C21.0976 3.68342 21.0976 4.31658 20.7071 4.70711L7.41421 18L18 18C18.5523 18 19 18.4477 19 19Z" fill="currentColor"/>
    </svg>
  )
}
