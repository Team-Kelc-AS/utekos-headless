import { ICON_COLORS, type IconProps } from './icon-types'

export function PhotoIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M5.5 2A3.5 3.5 0 0 0 2 5.5v13A3.5 3.5 0 0 0 5.5 22h13a3.5 3.5 0 0 0 3.5-3.5v-13A3.5 3.5 0 0 0 18.5 2h-13zM4 16.056V18.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-2.444l-4.75-2.112a8 8 0 0 0-6.5 0L4 16.056zM8.5 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" clipRule="evenodd"/>
    </svg>
  )
}
