import { handleShopifyCheckoutRecoveryEvidence } from '@/lib/email/abandonedCheckoutRecovery/handleShopifyCheckoutRecoveryEvidence'
import { postgresShopifyCheckoutRecoveryEvidenceStore } from '@/lib/email/abandonedCheckoutRecovery/postgresShopifyCheckoutRecoveryEvidenceStore'

export const maxDuration = 60

function handle(request: Request) {
  return handleShopifyCheckoutRecoveryEvidence(request, {
    enabled:
      process.env.ABANDONED_CHECKOUT_RECOVERY_ENABLED === 'true',
    store: postgresShopifyCheckoutRecoveryEvidenceStore
  })
}

export function POST(request: Request) {
  return handle(request)
}

export function OPTIONS(request: Request) {
  return handle(request)
}
