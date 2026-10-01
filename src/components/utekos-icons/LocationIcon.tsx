import { ICON_COLORS, type IconProps } from './icon-types'

export function LocationIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M3 10a9 9 0 0 1 18 0c0 2.847-1.567 5.575-3.231 7.694-1.687 2.148-3.602 3.832-4.55 4.613a1.908 1.908 0 0 1-2.438 0c-.948-.781-2.863-2.465-4.55-4.613C4.567 15.574 3 12.847 3 10zm9 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" clipRule="evenodd"/>
    </svg>
  )
}
