import { ICON_COLORS, type IconProps } from './icon-types'

export function WatchIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fill="currentColor" fill-rule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h6.36a1 1 0 0 1 .98.804l.413 2.063c.063.313.276.57.547.74A4 4 0 0 1 19 8v8c0 1.43-.75 2.685-1.88 3.392-.27.17-.484.428-.547.741l-.412 2.063a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.413-2.063c-.063-.313-.276-.57-.547-.74A4 4 0 0 1 5 16V8c0-1.43.75-2.685 1.88-3.392.27-.17.484-.428.547-.741l.412-2.063zM9 6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z" clip-rule="evenodd"/>
    </svg>
  )
}
