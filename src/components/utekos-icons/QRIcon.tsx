import { ICON_COLORS, type IconProps } from './icon-types'

export function QRIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M2 4a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zm7 0H4v5h5V4zM2 15a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5zm7 0H4v5h5v-5zm6-13a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-5zm0 2h5v5h-5V4zm1.5 11a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm3.5 1.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm1.5 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM15 21.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" clipRule="evenodd"/>
    </svg>
  )
}
