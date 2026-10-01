import { ICON_COLORS, type IconProps } from './icon-types'

export function CameraSwitchIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M6.426 2.559A3.5 3.5 0 0 1 9.338 1h5.324a3.5 3.5 0 0 1 2.912 1.559l.516.773A1.5 1.5 0 0 0 19.338 4h.162A3.5 3.5 0 0 1 23 7.5v10a3.5 3.5 0 0 1-3.5 3.5h-15A3.5 3.5 0 0 1 1 17.5v-10A3.5 3.5 0 0 1 4.5 4h.162a1.5 1.5 0 0 0 1.248-.668l.516-.773zm-1.456 8.91a.75.75 0 1 0 1.06 1.061l1.22-1.22V12A4.75 4.75 0 0 0 12 16.75h.5a.75.75 0 0 0 0-1.5H12A3.25 3.25 0 0 1 8.75 12v-.69l1.22 1.22a.75.75 0 1 0 1.06-1.06l-2.5-2.5a.75.75 0 0 0-1.06 0l-2.5 2.5zM11.5 6.25a.75.75 0 0 0 0 1.5h.5a3.248 3.248 0 0 1 3.25 3.248v.691l-1.22-1.22a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.06 0l2.5-2.5a.75.75 0 1 0-1.06-1.06l-1.22 1.22v-.692A4.749 4.749 0 0 0 12 6.25h-.5z" clipRule="evenodd"/>
    </svg>
  )
}
