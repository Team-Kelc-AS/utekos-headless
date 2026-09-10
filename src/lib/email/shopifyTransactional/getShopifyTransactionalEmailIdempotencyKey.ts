import type {
  ShopifyTransactionalEmailEvidence
} from './shopifyTransactionalEmailEvidenceContract'

export function getShopifyTransactionalEmailIdempotencyKey(
  evidence: ShopifyTransactionalEmailEvidence
): string {
  const resourceId = (
    evidence.shopifyFulfillmentId
    ?? evidence.shopifyOrderId
  ).split('/').at(-1)

  if (!resourceId || !/^[1-9][0-9]{0,19}$/u.test(resourceId)) {
    throw new Error(
      'shopify_transactional_email_resource_id_invalid'
    )
  }

  return [
    'shopify-transactional',
    'v1',
    evidence.notificationType,
    resourceId
  ].join('/')
}
