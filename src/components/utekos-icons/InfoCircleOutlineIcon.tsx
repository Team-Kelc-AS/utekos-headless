import { ICON_COLORS, type IconProps } from './icon-types'

export function InfoCircleOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      
<path fillRule="evenodd" clipRule="evenodd" d="M23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12ZM21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM10.5 7.75C10.5 6.92157 11.1716 6.25 12 6.25C12.8284 6.25 13.5 6.92157 13.5 7.75C13.5 8.57843 12.8284 9.25 12 9.25C11.1716 9.25 10.5 8.57843 10.5 7.75ZM11 11.75C11 11.1977 11.4477 10.75 12 10.75C12.5523 10.75 13 11.1977 13 11.75V16.75C13 17.3023 12.5523 17.75 12 17.75C11.4477 17.75 11 17.3023 11 16.75V11.75Z" fill="currentColor"/>

    </svg>
  )
}
