import { ICON_COLORS, type IconProps } from './icon-types'

export function ExclamationMarkTriangleOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M13.752 2.111c-.76-1.381-2.745-1.381-3.504 0L.938 19.036C.207 20.37 1.17 22 2.692 22H21.31c1.521 0 2.485-1.63 1.752-2.964zM2.692 20 12 3.075 21.31 20H2.69zm8.103-11.25a1.206 1.206 0 1 1 2.41 0l-.17 4.75a1.036 1.036 0 0 1-2.07 0zM10.5 17a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0" clip-rule="evenodd"/>
    </svg>
  )
}
