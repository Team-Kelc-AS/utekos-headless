import {
  handleShopifyTransactionalEmailEvidence
} from '@/lib/email/shopifyTransactional/handleShopifyTransactionalEmailEvidence'
import {
  verifyShopifyPlatformAppOidc
} from '@/lib/email/abandonedCheckoutRecovery/verifyShopifyPlatformAppOidc'

export const maxDuration = 60

export function POST(request: Request) {
  return handleShopifyTransactionalEmailEvidence(request, {
    verifyCaller: verifyShopifyPlatformAppOidc
  })
}
