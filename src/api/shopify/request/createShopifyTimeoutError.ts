export function createShopifyTimeoutError(): DOMException {
  return new DOMException(
    'The operation was aborted due to timeout',
    'TimeoutError'
  )
}
