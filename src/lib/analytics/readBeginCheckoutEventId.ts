import { z } from 'zod'
import { BEGIN_CHECKOUT_EVENT_ATTRIBUTE } from './checkoutAttributionSnapshot'

export function readBeginCheckoutEventId(
  attributes: ReadonlyArray<{ name: string; value: string }>
): string | undefined {
  const values = attributes
    .filter(attribute => attribute.name === BEGIN_CHECKOUT_EVENT_ATTRIBUTE)
    .map(attribute => attribute.value)
  if (values.length !== 1) return undefined
  const result = z.uuid().safeParse(values[0])
  return result.success ? result.data : undefined
}
