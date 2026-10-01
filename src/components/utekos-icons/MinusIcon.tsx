import { ICON_COLORS, type IconProps } from './icon-types'

export function MinusIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      
<rect x="3" y="10.5" width="18" height="3" rx="1.5" fill="currentColor"/>

    </svg>
  )
}
