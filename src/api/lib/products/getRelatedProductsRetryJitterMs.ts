import {
  RELATED_PRODUCTS_RETRY_JITTER_MAX_MS,
  RELATED_PRODUCTS_RETRY_JITTER_MIN_MS
} from './relatedProductsPolicy'

export function getRelatedProductsRetryJitterMs(
  random: () => number = Math.random
): number {
  const sample = random()
  const normalizedSample =
    Number.isFinite(sample) ? Math.min(1, Math.max(0, sample)) : 0
  const span =
    RELATED_PRODUCTS_RETRY_JITTER_MAX_MS -
    RELATED_PRODUCTS_RETRY_JITTER_MIN_MS

  return (
    RELATED_PRODUCTS_RETRY_JITTER_MIN_MS +
    Math.floor(normalizedSample * (span + 1))
  )
}
