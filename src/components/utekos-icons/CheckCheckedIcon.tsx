import { ICON_COLORS, type IconProps } from './icon-types'

export function CheckCheckedIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      
<path fillRule="evenodd" clipRule="evenodd" d="M12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1ZM16.7929 7.29289L9.5 14.5858L7.20711 12.2929C6.81658 11.9024 6.18342 11.9024 5.79289 12.2929C5.40237 12.6834 5.40237 13.3166 5.79289 13.7071L8.79289 16.7071C9.18342 17.0976 9.81658 17.0976 10.2071 16.7071L18.2071 8.70711C18.5976 8.31658 18.5976 7.68342 18.2071 7.29289C17.8166 6.90237 17.1834 6.90237 16.7929 7.29289Z" fill="currentColor"/>

    </svg>
  )
}
