import { MissingCartIdError } from '@/lib/errors/MissingCartIdError'

export function requireCartId(cartId: string | null): string {
  if (!cartId) {
    throw new MissingCartIdError()
  }

  return cartId
}
