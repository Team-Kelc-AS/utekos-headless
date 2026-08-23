import type { ProtectedShopifyCheckoutRecoveryEvidence } from './shopifyCheckoutRecoveryEvidenceContract'

export type ShopifyCheckoutRecoveryEvidenceWriteResult = {
  status: 'inserted' | 'duplicate' | 'conflict'
  observationCount: number
}

export interface ShopifyCheckoutRecoveryEvidenceStore {
  persist(
    evidence: ProtectedShopifyCheckoutRecoveryEvidence
  ): Promise<ShopifyCheckoutRecoveryEvidenceWriteResult>
}
