import type { KlarnaExpressCheckoutAuthorizationResult } from '@/components/klarna/types'

export type KlarnaAuthorizationOutcome =
  | 'approved'
  | 'dismissed'
  | 'unavailable'

export function classifyKlarnaAuthorizationResult(
  result: KlarnaExpressCheckoutAuthorizationResult
): KlarnaAuthorizationOutcome {
  if (result.approved && result.authorization_token) {
    return 'approved'
  }

  return result.show_form === false ? 'unavailable' : 'dismissed'
}
