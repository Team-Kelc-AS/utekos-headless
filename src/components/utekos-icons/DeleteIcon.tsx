import { ICON_COLORS, type IconProps } from './icon-types'

export function DeleteIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M5 7H4a1 1 0 0 1 0-2h3.1a5.002 5.002 0 0 1 9.8 0H20a1 1 0 1 1 0 2h-1v12.5a3.5 3.5 0 0 1-3.5 3.5h-7A3.5 3.5 0 0 1 5 19.5V7zm9.83-2a3.001 3.001 0 0 0-5.66 0h5.66zM14 9.5a1 1 0 0 1 1 1V18a1 1 0 1 1-2 0v-7.5a1 1 0 0 1 1-1zm-3 1a1 1 0 1 0-2 0V18a1 1 0 1 0 2 0v-7.5z" clipRule="evenodd"/>
    </svg>
  )
}
