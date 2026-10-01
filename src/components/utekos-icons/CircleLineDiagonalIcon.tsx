import { ICON_COLORS, type IconProps } from './icon-types'

export function CircleLineDiagonalIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      
<path fillRule="evenodd" clipRule="evenodd" d="M2.5 8C2.5 4.96243 4.96243 2.5 8 2.5C9.24835 2.5 10.3996 2.9159 11.3226 3.6167L10.9697 3.96967L7.46967 7.46967L3.96967 10.9697L3.6167 11.3226C2.9159 10.3996 2.5 9.24835 2.5 8ZM4.67736 12.3833C5.60043 13.0841 6.75165 13.5 8 13.5C11.0376 13.5 13.5 11.0376 13.5 8C13.5 6.75165 13.0841 5.60043 12.3833 4.67736L12.0303 5.03033L8.53033 8.53033L5.03033 12.0303L4.67736 12.3833ZM8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1Z" fill="currentColor"/>

    </svg>
  )
}
