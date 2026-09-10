import {
  processShopifyTransactionalEmailEvidence
} from '@/lib/email/shopifyTransactional/processShopifyTransactionalEmailEvidence'
import {
  purgeExpiredShopifyTransactionalEmailAudit
} from '@/lib/email/shopifyTransactional/purgeExpiredShopifyTransactionalEmailAudit'
import type {
  ShopifyTransactionalEmailEvidence
} from '@/lib/email/shopifyTransactional/shopifyTransactionalEmailEvidenceContract'

async function sendShopifyTransactionalEmail(
  evidence: ShopifyTransactionalEmailEvidence
) {
  'use step'

  const result = await processShopifyTransactionalEmailEvidence(
    evidence
  )

  console.info('[shopify-transactional-email] processed', {
    notificationType: evidence.notificationType,
    status: result.status,
    ...(
      result.status === 'suppressed'
        ? { suppressionReason: result.reason }
        : {}
    )
  })

  return result
}

async function purgeExpiredTransactionalEmailAudit() {
  'use step'

  const deleted =
    await purgeExpiredShopifyTransactionalEmailAudit()

  console.info('[shopify-transactional-email] retention complete', {
    deleted
  })

  return deleted
}

export async function shopifyTransactionalEmailWorkflow(
  evidence: ShopifyTransactionalEmailEvidence
) {
  'use workflow'

  const auditRowsPurged =
    await purgeExpiredTransactionalEmailAudit()
  const delivery = await sendShopifyTransactionalEmail(evidence)

  return { auditRowsPurged, delivery }
}
