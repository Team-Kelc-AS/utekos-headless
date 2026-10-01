import { ICON_COLORS, type IconProps } from './icon-types'

export function PencilSquareIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      
<path fillRule="evenodd" clipRule="evenodd" d="M22.457 4.4571L21.4873 5.4268L18.573 2.51258L19.5427 1.54288C20.3475 0.738146 21.6522 0.738147 22.457 1.54288C23.2617 2.34762 23.2617 3.65236 22.457 4.4571ZM9.65559 11.43L17.5124 3.57324L20.4266 6.48745L12.5698 14.3443C12.2346 14.6794 11.8349 14.943 11.3948 15.119L9.37341 15.9276C8.55621 16.2545 7.74542 15.4435 8.07224 14.6264L8.8808 12.605C9.05683 12.165 9.32043 11.7652 9.65559 11.43ZM4 5.5C4 4.67157 4.67157 4 5.5 4H13C13.5523 4 14 3.55228 14 3C14 2.44772 13.5523 2 13 2H5.5C3.567 2 2 3.567 2 5.5V18.5C2 20.433 3.567 22 5.5 22H18.5C20.433 22 22 20.433 22 18.5V11C22 10.4477 21.5523 10 21 10C20.4477 10 20 10.4477 20 11V18.5C20 19.3284 19.3284 20 18.5 20H5.5C4.67157 20 4 19.3284 4 18.5V5.5Z" fill="currentColor"/>

    </svg>
  )
}
