import { ICON_COLORS, type IconProps } from './icon-types'

export function CaretDownIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M12.707 15.707a1 1 0 0 1-1.414 0l-5-5a1 1 0 1 1 1.414-1.414L12 13.586l4.293-4.293a1 1 0 0 1 1.414 1.414l-5 5z" clipRule="evenodd"/>
    </svg>
  )
}
