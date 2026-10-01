import { ICON_COLORS, type IconProps } from './icon-types'

export function PersonCircleOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M3 12a9 9 0 1 1 16.124 5.5 9.012 9.012 0 0 0-3.68-2.815A9 9 0 0 0 4.876 17.5 8.961 8.961 0 0 1 3 12zm3.287 6.955A8.963 8.963 0 0 0 12 21a8.963 8.963 0 0 0 5.713-2.045 7 7 0 0 0-11.426 0zM12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" clipRule="evenodd"/>
    </svg>
  )
}
