import { MessageCircleIcon } from 'lucide-react'
import type { RefObject } from 'react'

type CustomerAssistantLauncherProps = {
  controls: string
  expanded: boolean
  launcherRef: RefObject<HTMLButtonElement | null>
  onClick: () => void
}

export function CustomerAssistantLauncher({
  controls,
  expanded,
  launcherRef,
  onClick
}: CustomerAssistantLauncherProps) {
  return (
    <button
      ref={launcherRef}
      type='button'
      aria-controls={controls}
      aria-expanded={expanded}
      onClick={onClick}
      className='fixed right-4 bottom-4 z-40 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transform-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:right-6 sm:bottom-6'
    >
      <MessageCircleIcon className='size-5' aria-hidden='true' />
      <span>Kjøpshjelp</span>
    </button>
  )
}
