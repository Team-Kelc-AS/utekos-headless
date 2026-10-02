import { ICON_COLORS, type IconProps } from './icon-types'

export function ExclamationMarkTriangleIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M10.248 2.111c.76-1.381 2.745-1.381 3.505 0l9.308 16.925C23.794 20.37 22.83 22 21.31 22H2.69C1.171 22 .206 20.37.94 19.036zm.547 6.638a1.206 1.206 0 1 1 2.41 0l-.17 4.752a1.036 1.036 0 0 1-2.07 0zM10.5 17a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0" clip-rule="evenodd"/>
    </svg>
  )
}
