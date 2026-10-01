import { ICON_COLORS, type IconProps } from './icon-types'

export function CameraOutlineIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" d="M16.742 3.113l.832-.554-.832.554zm.516.774l-.832.554.832-.554zm-10.516 0l.832.554-.832-.554zm.516-.774l-.832-.554.832.554zm10.316-.554A3.5 3.5 0 0 0 14.662 1v2c.502 0 .97.25 1.248.668l1.664-1.11zm.516.773l-.516-.773-1.664 1.109.516.773 1.664-1.109zM19.338 4a1.5 1.5 0 0 1-1.248-.668l-1.664 1.11A3.5 3.5 0 0 0 19.338 6V4zm.162 0h-.162v2h.162V4zM23 7.5A3.5 3.5 0 0 0 19.5 4v2A1.5 1.5 0 0 1 21 7.5h2zm0 10v-10h-2v10h2zM19.5 21a3.5 3.5 0 0 0 3.5-3.5h-2a1.5 1.5 0 0 1-1.5 1.5v2zm-15 0h15v-2h-15v2zM1 17.5A3.5 3.5 0 0 0 4.5 21v-2A1.5 1.5 0 0 1 3 17.5H1zm0-10v10h2v-10H1zM4.5 4A3.5 3.5 0 0 0 1 7.5h2A1.5 1.5 0 0 1 4.5 6V4zm.162 0H4.5v2h.162V4zm1.248-.668A1.5 1.5 0 0 1 4.662 4v2a3.5 3.5 0 0 0 2.912-1.559L5.91 3.332zm.516-.773l-.516.773 1.664 1.11.516-.774-1.664-1.11zM9.338 1a3.5 3.5 0 0 0-2.912 1.559L8.09 3.668A1.5 1.5 0 0 1 9.338 3V1zm5.324 0H9.338v2h5.324V1zM15 12a3 3 0 0 1-3 3v2a5 5 0 0 0 5-5h-2zm-3-3a3 3 0 0 1 3 3h2a5 5 0 0 0-5-5v2zm-3 3a3 3 0 0 1 3-3V7a5 5 0 0 0-5 5h2zm3 3a3 3 0 0 1-3-3H7a5 5 0 0 0 5 5v-2z"/>
    </svg>
  )
}
