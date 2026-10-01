import { ICON_COLORS, type IconProps } from './icon-types'

export function BoxOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M13.825 1.943a3.5 3.5 0 0 0-3.65 0l-6.5 3.972A3.5 3.5 0 0 0 2 8.902v7.053a3.5 3.5 0 0 0 1.935 3.13l6.5 3.25a3.5 3.5 0 0 0 3.13 0l6.5-3.25A3.5 3.5 0 0 0 22 15.955V8.902a3.5 3.5 0 0 0-1.675-2.987l-6.5-3.972zm-2.147 1.522c-.16.035-.316.097-.46.185l-6.3 3.85L12 11.828l3.979-2.431 3.036-1.856-7.337-4.076zM4 9.283v6.672a1.5 1.5 0 0 0 .83 1.341L11 20.382V13.56L4 9.283zm9 11.099l6.17-3.086a1.5 1.5 0 0 0 .83-1.341V9.283l-2.979 1.82L13 13.561v6.82z" clipRule="evenodd"/>
    </svg>
  )
}
