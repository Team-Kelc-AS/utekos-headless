import { ICON_COLORS, type IconProps } from './icon-types'

export function NotificationsOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fillRule="evenodd" d="M8 7.217C8 4.847 9.83 3 12 3s4 1.848 4 4.217v2.747a3.5 3.5 0 0 0 1.025 2.475l.975.975V14H6v-.586l.975-.975A3.5 3.5 0 0 0 8 9.964V7.217zM12 1C8.647 1 6 3.824 6 7.217v2.747a1.5 1.5 0 0 1-.44 1.061L4.587 12A2 2 0 0 0 4 13.414V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-.586A2 2 0 0 0 19.414 12l-.975-.975A1.5 1.5 0 0 1 18 9.965V7.216C18 3.824 15.353 1 12 1zm0 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" clipRule="evenodd"/>
    </svg>
  )
}
