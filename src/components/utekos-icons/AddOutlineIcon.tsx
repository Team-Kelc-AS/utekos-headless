import { ICON_COLORS, type IconProps } from './icon-types'

export function AddOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 324 323.999988" preserveAspectRatio="xMidYMid meet"
      width={size}
      height={size}
      color={ICON_COLORS[tone]}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d="M 162 310.5 C 244.015625 310.5 310.5 244.015625 310.5 162 C 310.5 79.984375 244.015625 13.5 162 13.5 C 79.984375 13.5 13.5 79.984375 13.5 162 C 13.5 244.015625 79.984375 310.5 162 310.5 Z M 162 283.5 C 229.101562 283.5 283.5 229.101562 283.5 162 C 283.5 94.898438 229.101562 40.5 162 40.5 C 94.898438 40.5 40.5 94.898438 40.5 162 C 40.5 229.101562 94.898438 283.5 162 283.5 Z M 148.5 101.25 C 148.5 93.792969 154.542969 87.75 162 87.75 C 169.457031 87.75 175.5 93.792969 175.5 101.25 L 175.5 148.5 L 222.75 148.5 C 230.207031 148.5 236.25 154.542969 236.25 162 C 236.25 169.457031 230.207031 175.5 222.75 175.5 L 175.5 175.5 L 175.5 222.75 C 175.5 230.207031 169.457031 236.25 162 236.25 C 154.542969 236.25 148.5 230.207031 148.5 222.75 L 148.5 175.5 L 101.25 175.5 C 93.792969 175.5 87.75 169.457031 87.75 162 C 87.75 154.542969 93.792969 148.5 101.25 148.5 L 148.5 148.5 Z M 148.5 101.25 " fillOpacity="1" fillRule="evenodd"/>
    </svg>
  )
}
