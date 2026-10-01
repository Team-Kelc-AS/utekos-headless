import { ICON_COLORS, type IconProps } from './icon-types'

export function SealIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      
<path fillRule="evenodd" clipRule="evenodd" d="M13.4153 2.00232C12.634 1.21972 11.3659 1.21972 10.5845 2.00232L8.65803 3.93198L5.9313 3.92975C4.82545 3.92885 3.92876 4.82554 3.92966 5.93139L3.93189 8.65812L2.00223 10.5846C1.21963 11.3659 1.21964 12.6341 2.00223 13.4154L3.93189 15.3419L3.92966 18.0686C3.92876 19.1745 4.82545 20.0712 5.9313 20.0702L8.65803 20.068L10.5845 21.9977C11.3659 22.7803 12.634 22.7803 13.4153 21.9977L15.3418 20.068L18.0685 20.0702C19.1744 20.0712 20.0711 19.1745 20.0702 18.0686L20.0679 15.3419L21.9976 13.4154C22.7802 12.6341 22.7802 11.3659 21.9976 10.5846L20.0679 8.65812L20.0702 5.93139C20.0711 4.82554 19.1744 3.92885 18.0685 3.92975L15.3418 3.93198L13.4153 2.00232Z" fill="currentColor"/>

    </svg>
  )
}
