import { ICON_COLORS, type IconProps } from './icon-types'

export function FlashIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="m5.99 12.46 6.169-9.596c.54-.84 1.841-.457 1.841.54V9.5a.5.5 0 0 0 .5.5h2.668a1 1 0 0 1 .842 1.54l-6.169 9.596c-.54.84-1.841.457-1.841-.54V14.5a.5.5 0 0 0-.5-.5H6.832a1 1 0 0 1-.841-1.54z" clip-rule="evenodd"/>
    </svg>
  )
}
