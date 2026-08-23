import { handleShopifyCheckoutRecoveryWebhookEvidence } from '@/lib/email/abandonedCheckoutRecovery/handleShopifyCheckoutRecoveryWebhookEvidence'
import { postgresShopifyCheckoutRecoveryWebhookEvidenceStore } from '@/lib/email/abandonedCheckoutRecovery/postgresShopifyCheckoutRecoveryWebhookEvidenceStore'
import { verifyShopifyPlatformAppOidc } from '@/lib/email/abandonedCheckoutRecovery/verifyShopifyPlatformAppOidc'

export const maxDuration = 60

export function POST(request: Request) {
  return handleShopifyCheckoutRecoveryWebhookEvidence(request, {
    verifyCaller: verifyShopifyPlatformAppOidc,
    store: postgresShopifyCheckoutRecoveryWebhookEvidenceStore
  })
}
