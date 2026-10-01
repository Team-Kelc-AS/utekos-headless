import { ICON_COLORS, type IconProps } from './icon-types'

export function PurchasesOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M20.045 3.403l-8.979-.628a1.5 1.5 0 0 0-1.6 1.392L8.419 19.13a1.5 1.5 0 0 0 1.392 1.601l8.978.628a1.5 1.5 0 0 0 1.6-1.392l1.047-14.963a1.5 1.5 0 0 0-1.391-1.601zM11.206.78A3.5 3.5 0 0 0 7.47 4.027L6.424 18.991a3.5 3.5 0 0 0 3.247 3.735l8.978.628a3.5 3.5 0 0 0 3.736-3.247l1.046-14.964a3.5 3.5 0 0 0-3.247-3.735L11.206.78zM5.071 2.338c.31-.043.565.244.544.555l-.07.998a.5.5 0 0 1-.43.46l-1.006.142a1.5 1.5 0 0 0-1.277 1.694l1.67 11.883c.005.035.011.07.019.104.011.054.017.11.014.166l-.106 1.512a3.573 3.573 0 0 0-.007.14c-.013.424-.45.762-.767.479a3.486 3.486 0 0 1-1.133-2.122L.852 6.466A3.5 3.5 0 0 1 3.83 2.513l1.24-.175zm9.961 8.233a2.5 2.5 0 1 0 .35-4.988 2.5 2.5 0 0 0-.35 4.988zm2.68 4.698a1 1 0 0 0 .139-1.995l-5.986-.419a1 1 0 0 0-.14 1.995l5.986.42zm.822 2.564a1 1 0 0 1-1.067.928l-5.985-.419a1 1 0 0 1 .14-1.995l5.985.418a1 1 0 0 1 .927 1.068z" clipRule="evenodd"/>
    </svg>
  )
}
