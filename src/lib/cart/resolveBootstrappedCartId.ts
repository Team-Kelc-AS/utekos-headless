export function resolveBootstrappedCartId(
  currentCartId: string | null,
  persistedCartId: string | null
): string | null {
  return currentCartId ?? persistedCartId
}
