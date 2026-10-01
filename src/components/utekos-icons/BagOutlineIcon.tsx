import { ICON_COLORS, type IconProps } from './icon-types'

export function BagOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M12 4a3.001 3.001 0 0 0-2.83 2h5.66A3.001 3.001 0 0 0 12 4zM8 8h11.069l.742 10.393A1.5 1.5 0 0 1 18.315 20H5.685a1.5 1.5 0 0 1-1.496-1.607L4.93 8H8zm4-6a5.002 5.002 0 0 1 4.9 4h2.169a2 2 0 0 1 1.995 1.858l.742 10.393A3.5 3.5 0 0 1 18.316 22H5.684a3.5 3.5 0 0 1-3.491-3.75l.742-10.393A2 2 0 0 1 4.931 6h2.17A5.002 5.002 0 0 1 12 2zM9.147 9.927a1 1 0 1 0-1.902.618 5 5 0 0 0 9.51 0 1 1 0 1 0-1.902-.618 3 3 0 0 1-5.706 0z" clipRule="evenodd"/>
    </svg>
  )
}
