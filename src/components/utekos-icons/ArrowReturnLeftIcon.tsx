import { ICON_COLORS, type IconProps } from './icon-types'

export function ArrowReturnLeftIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      
<g clipPath="url(#clip0_3904_8853)">
<path d="M3 15L14 15C17.3137 15 20 12.3137 20 9V9C20 5.68629 17.3137 3 14 3L13 3M3 15L8 10M3 15L8 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</g>
<defs>
<clipPath id="clip0_3904_8853">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>

    </svg>
  )
}
