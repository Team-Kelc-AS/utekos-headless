import { ICON_COLORS, type IconProps } from './icon-types'

export function PurchasesIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M7.47 4.027A3.5 3.5 0 0 1 11.207.78l8.978.628a3.5 3.5 0 0 1 3.248 3.735l-1.047 14.964a3.5 3.5 0 0 1-3.735 3.247l-8.978-.628a3.5 3.5 0 0 1-3.248-3.735L7.471 4.027zm10.266 3.725a2.5 2.5 0 1 1-4.988-.348 2.5 2.5 0 0 1 4.988.348zm1.043 6.59a1 1 0 0 1-1.068.927l-5.985-.418a1 1 0 1 1 .14-1.996l5.985.419a1 1 0 0 1 .928 1.067zm-1.347 4.917a1 1 0 1 0 .14-1.995l-5.986-.418a1 1 0 1 0-.139 1.995l5.985.418zM5.615 2.893c.022-.311-.235-.598-.543-.555l-1.241.175A3.5 3.5 0 0 0 .852 6.466l1.67 11.883c.12.852.538 1.59 1.133 2.122.317.283.754-.055.767-.48.001-.046.004-.093.007-.14L5.615 2.894z" clipRule="evenodd"/>
    </svg>
  )
}
