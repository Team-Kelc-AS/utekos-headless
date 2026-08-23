import type { ProtectedShopifyCheckoutRecoveryWebhookEvidence } from './shopifyCheckoutRecoveryEvidenceContract'
import type { ShopifyCheckoutRecoveryEvidenceWriteResult } from './shopifyCheckoutRecoveryEvidenceStore'

export interface ShopifyCheckoutRecoveryWebhookEvidenceStore {
  persist(
    evidence: ProtectedShopifyCheckoutRecoveryWebhookEvidence
  ): Promise<ShopifyCheckoutRecoveryEvidenceWriteResult>
}
