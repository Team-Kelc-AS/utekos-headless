import { ICON_COLORS, type IconProps } from './icon-types'

export function HandIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" fillRule="evenodd" d="M11.625 2c-.621 0-1.125.504-1.125 1.125v7.495a16.03 16.03 0 0 0-1 .13V5.125a1.125 1.125 0 0 0-2.25 0v6.158c-.316.1-.63.209-.94.328l-.06.024v-4.51a1.125 1.125 0 0 0-2.25 0v7.532a7.343 7.343 0 0 0 13.639 3.778l3.398-5.664a1.152 1.152 0 0 0-1.849-1.358L16 15V4.125a1.125 1.125 0 0 0-2.25 0v6.51c-.333-.035-.666-.06-1-.075V3.125c0-.621-.504-1.125-1.125-1.125z" clipRule="evenodd"/>
    </svg>
  )
}
