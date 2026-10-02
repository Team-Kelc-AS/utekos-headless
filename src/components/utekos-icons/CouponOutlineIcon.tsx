import { ICON_COLORS, type IconProps } from './icon-types'

export function CouponOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d="m2.25 9.01-.082.997zm0 5.98.082.996zm19.5 0 .082-.997zm0-5.98-.082-.996zM3 4a2 2 0 0 0-2 2h2zm18 0H3v2h18zm2 2a2 2 0 0 0-2-2v2zm0 2.75V6h-2v2.75zM20 12a2 2 0 0 1 1.832-1.993l-.164-1.993A4 4 0 0 0 18 12zm1.832 1.993A2 2 0 0 1 20 12h-2a4 4 0 0 0 3.668 3.986zM23 18v-2.75h-2V18zm-2 2a2 2 0 0 0 2-2h-2zM3 20h18v-2H3zm-2-2a2 2 0 0 0 2 2v-2zm0-2.75V18h2v-2.75zM4 12a2 2 0 0 1-1.832 1.993l.164 1.993A4 4 0 0 0 6 12zm-1.832-1.993A2 2 0 0 1 4 12h2a4 4 0 0 0-3.668-3.986zM1 6v2.75h2V6zm1.332 2.014A.733.733 0 0 1 3 8.75H1c0 .71.565 1.207 1.168 1.257zM3 15.25c0 .434-.34.71-.668.736l-.164-1.993C1.565 14.043 1 14.54 1 15.25zm18.668.736A.733.733 0 0 1 21 15.25h2c0-.71-.565-1.207-1.168-1.257zM21 8.75c0-.434.34-.71.668-.736l.164 1.993C22.435 9.957 23 9.46 23 8.75z"/>
    </svg>
  )
}
