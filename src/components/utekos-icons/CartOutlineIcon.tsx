import { ICON_COLORS, type IconProps } from './icon-types'

export function CartOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M1 3a1 1 0 0 0 0 2h1.531l.493 2.217 1.565 7.042A3.5 3.5 0 0 0 8.005 17h7.99a3.5 3.5 0 0 0 3.416-2.74l1.295-5.826A2 2 0 0 0 18.753 6H4.803l-.32-1.434A2 2 0 0 0 2.532 3zm5.541 10.825L5.247 8h13.506l-1.294 5.825A1.5 1.5 0 0 1 15.995 15h-7.99a1.5 1.5 0 0 1-1.464-1.175M9 20.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m9 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" clip-rule="evenodd"/>
    </svg>
  )
}
