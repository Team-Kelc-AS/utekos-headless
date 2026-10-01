import { ICON_COLORS, type IconProps } from './icon-types'

export function NotificationBadgeIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      
<g clipPath="url(#clip0_1907_31)">
<path fillRule="evenodd" clipRule="evenodd" d="M14.1 4.0002C13.9398 4 13.7732 4 13.6 4H10.4C8.15979 4 7.03969 4 6.18404 4.43597C5.43139 4.81947 4.81947 5.43139 4.43597 6.18404C4 7.03968 4 8.15979 4 10.4V13.6C4 15.8402 4 16.9603 4.43597 17.816C4.81947 18.5686 5.43139 19.1805 6.18404 19.564C7.03969 20 8.15979 20 10.4 20H13.6C15.8402 20 16.9603 20 17.816 19.564C18.5686 19.1805 19.1805 18.5686 19.564 17.816C20 16.9603 20 15.8402 20 13.6V10.4C20 10.2268 20 10.0602 19.9998 9.90002C19.6768 9.96558 19.3424 10 19 10C16.2386 10 14 7.76142 14 5C14 4.65761 14.0344 4.32325 14.1 4.0002ZM19.9512 7.84606C19.6523 7.94592 19.3325 8 19 8C17.3431 8 16 6.65685 16 5C16 4.66752 16.0541 4.34768 16.1539 4.04878C16.1785 3.9753 16.2058 3.90309 16.2358 3.83226C16.6912 2.75552 17.7574 2 19 2C20.6569 2 22 3.34315 22 5C22 6.32438 21.1418 7.44831 19.9512 7.84606Z" fill="currentColor"/>
</g>
<defs>
<clipPath id="clip0_1907_31">
<rect width="24" height="24" fill="white"/>
</clipPath>
</defs>

    </svg>
  )
}
