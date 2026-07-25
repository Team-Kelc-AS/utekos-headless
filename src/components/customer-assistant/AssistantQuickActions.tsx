import type { AssistantIntent } from '@/lib/customer-assistant/assistantProtocol'
import type { RefObject } from 'react'

const quickActions: Array<{
  intent: AssistantIntent
  label: string
  prompt: string
}> = [
  {
    intent: 'product_help',
    label: 'Finn riktig produkt',
    prompt: 'Hjelp meg å finne riktig produkt.'
  },
  {
    intent: 'size_help',
    label: 'Hjelp med størrelse',
    prompt: 'Hjelp meg å velge riktig størrelse.'
  },
  {
    intent: 'stock_help',
    label: 'Se lagerstatus',
    prompt: 'Hjelp meg å sjekke lagerstatus.'
  },
  {
    intent: 'shipping_returns',
    label: 'Frakt og retur',
    prompt: 'Hva bør jeg vite om frakt og retur?'
  }
]

type AssistantQuickActionsProps = {
  disabled: boolean
  firstActionRef: RefObject<HTMLButtonElement | null>
  intent: AssistantIntent
  onSelect: (intent: AssistantIntent, prompt: string) => void
}

export function AssistantQuickActions({
  disabled,
  firstActionRef,
  intent,
  onSelect
}: AssistantQuickActionsProps) {
  return (
    <fieldset>
      <legend className='mb-3 text-sm font-medium text-popover-foreground'>
        Hva vil du ha hjelp med?
      </legend>
      <ul className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
        {quickActions.map((action, index) => (
          <li key={action.intent}>
            <button
              ref={index === 0 ? firstActionRef : undefined}
              type='button'
              disabled={disabled}
              aria-pressed={intent === action.intent}
              onClick={() =>
                onSelect(action.intent, action.prompt)
              }
              className='min-h-11 w-full rounded-xl border border-border bg-popover px-4 py-2.5 text-left text-sm font-medium text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-primary aria-pressed:bg-accent motion-reduce:transition-none'
            >
              {action.label}
            </button>
          </li>
        ))}
      </ul>
    </fieldset>
  )
}
