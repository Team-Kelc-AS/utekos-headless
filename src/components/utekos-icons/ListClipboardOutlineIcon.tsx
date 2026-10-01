import { ICON_COLORS, type IconProps } from './icon-types'

export function ListClipboardOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M6.5 5h.67A3.001 3.001 0 0 0 10 7h4a3.001 3.001 0 0 0 2.83-2h.67A1.5 1.5 0 0 1 19 6.5v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-13A1.5 1.5 0 0 1 6.5 5zm11-2h-.67A3.001 3.001 0 0 0 14 1h-4a3.001 3.001 0 0 0-2.83 2H6.5A3.5 3.5 0 0 0 3 6.5v13A3.5 3.5 0 0 0 6.5 23h11a3.5 3.5 0 0 0 3.5-3.5v-13A3.5 3.5 0 0 0 17.5 3zM10 3a1 1 0 0 0 0 2h4a1 1 0 1 0 0-2h-4zm2 8a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-4zm0 4a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-4zm-2-3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-1.5 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" clipRule="evenodd"/>
    </svg>
  )
}
