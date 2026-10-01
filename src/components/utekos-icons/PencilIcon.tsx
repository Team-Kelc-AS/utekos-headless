import { ICON_COLORS, type IconProps } from './icon-types'

export function PencilIcon({ tone = 'light', size = 24, title, ...props }: IconProps) {
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
      <path fillRule="evenodd" clipRule="evenodd" d="M18.7373 8.67677L19.707 7.70707C20.6498 6.76427 20.6498 5.23567 19.707 4.29286C18.7642 3.35005 17.2356 3.35005 16.2928 4.29286L15.3231 5.26256L18.7373 8.67677ZM14.2625 6.32322L4.71013 15.8755C4.32592 16.2598 4.03644 16.7281 3.86461 17.2436L3.05188 19.6818C2.79105 20.4643 3.53546 21.2089 4.31805 20.948L6.75627 20.1353C7.27174 19.9635 7.74013 19.674 8.12435 19.2898L17.6767 9.73743L14.2625 6.32322Z" fill="currentColor"/>
    </svg>
  )
}
