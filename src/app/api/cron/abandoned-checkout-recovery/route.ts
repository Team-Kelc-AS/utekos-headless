import {
  finishAbandonedCheckoutRecoveryCheckIn,
  startAbandonedCheckoutRecoveryCheckIn
} from '@/lib/email/abandonedCheckoutRecovery/abandonedCheckoutRecoverySentryMonitor'
import { getAbandonedCheckoutRecoveryRuntimeConfig } from '@/lib/email/abandonedCheckoutRecovery/getAbandonedCheckoutRecoveryRuntimeConfig'
import { runAbandonedCheckoutRecoveryBatch } from '@/lib/email/abandonedCheckoutRecovery/runAbandonedCheckoutRecoveryBatch'
import { hasValidCronAuthorization } from '@/lib/security/hasValidCronAuthorization'

export const maxDuration = 60

async function safelyFinishCheckIn(
  checkInId: string | null,
  status: 'ok' | 'error'
): Promise<void> {
  if (!checkInId) return

  try {
    await finishAbandonedCheckoutRecoveryCheckIn(checkInId, status)
  } catch {
    // Monitoring must not change recovery delivery state.
  }
}

export async function GET(request: Request) {
  if (
    !hasValidCronAuthorization(
      request.headers.get('authorization'),
      process.env.CRON_SECRET
    )
  ) {
    return Response.json(
      { ok: false },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    )
  }

  const config = getAbandonedCheckoutRecoveryRuntimeConfig()

  if (!config.enabled || !config.activatedAt) {
    return Response.json(
      { ok: true, enabled: false },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }

  let checkInId: string | null = null

  try {
    try {
      checkInId = startAbandonedCheckoutRecoveryCheckIn()
    } catch {
      checkInId = null
    }
    const summary = await runAbandonedCheckoutRecoveryBatch(
      config.activatedAt
    )

    await safelyFinishCheckIn(checkInId, 'ok')

    return Response.json(
      { ok: true, enabled: true, ...summary },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    await safelyFinishCheckIn(checkInId, 'error')

    return Response.json(
      { ok: false, enabled: true },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
