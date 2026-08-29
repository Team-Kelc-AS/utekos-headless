import { hasValidCronAuthorization } from '@/lib/security/hasValidCronAuthorization'
import { postgresIntegrationHealthStore } from '@/lib/observability/launchGuard/postgresIntegrationHealthStore'
import { sendTwilioLaunchGuardSms } from '@/lib/observability/launchGuard/twilioLaunchGuardSms'

const noStoreHeaders = { 'Cache-Control': 'no-store' } as const

type Dependencies = {
  environment: Readonly<Record<string, string | undefined>>
  fetch: typeof fetch
  getCronSecret: () => string | undefined
  now: () => Date
  sendSms: typeof sendTwilioLaunchGuardSms
  store: Pick<
    typeof postgresIntegrationHealthStore,
    'ensureTwilioTestIncident' | 'reserveDelivery' | 'updateDelivery'
  >
}

const defaultDependencies: Dependencies = {
  environment: process.env,
  fetch,
  getCronSecret: () => process.env.CRON_SECRET,
  now: () => new Date(),
  sendSms: sendTwilioLaunchGuardSms,
  store: postgresIntegrationHealthStore
}

export async function handleLaunchGuardSmsTest(
  request: Request,
  dependencies: Dependencies = defaultDependencies
) {
  if (
    !hasValidCronAuthorization(
      request.headers.get('authorization'),
      dependencies.getCronSecret()
    )
  ) {
    return Response.json(
      { ok: false },
      { status: 401, headers: noStoreHeaders }
    )
  }

  if (
    dependencies.environment.LAUNCH_GUARD_SMS_TEST_ENABLED !== 'true'
  ) {
    return Response.json(
      { ok: false, error: 'controlled_test_not_enabled' },
      { status: 409, headers: noStoreHeaders }
    )
  }

  const now = dependencies.now()
  const incident = await dependencies.store.ensureTwilioTestIncident(now)
  const deliveryId = await dependencies.store.reserveDelivery({
    channel: 'twilio_sms',
    currentOpenedAt: incident.currentOpenedAt,
    fingerprint: incident.fingerprint,
    incidentId: incident.id,
    kind: 'test',
    now
  })
  if (!deliveryId) {
    return Response.json(
      { ok: false, error: 'controlled_test_suppressed' },
      { status: 429, headers: noStoreHeaders }
    )
  }

  const result = await dependencies.sendSms({
    environment: dependencies.environment,
    fetch: dependencies.fetch,
    message: {
      deliveryId,
      integration: 'twilio',
      kind: 'test',
      severity: 'low',
      summaryCode: 'controlled_delivery_test',
      surface: 'critical_sms'
    }
  })
  if (result.status !== 'sent') {
    await dependencies.store.updateDelivery({
      deliveryId,
      failureCode: result.code,
      now,
      status:
        result.status === 'suppressed' ? 'suppressed' : 'failed'
    })
    return Response.json(
      { ok: false, error: result.code },
      { status: 503, headers: noStoreHeaders }
    )
  }

  await dependencies.store.updateDelivery({
    deliveryId,
    now,
    providerReceiptId: result.providerReceiptId,
    status: 'sent'
  })

  return Response.json(
    { ok: true, delivery_id: deliveryId, status: 'sent' },
    { status: 202, headers: noStoreHeaders }
  )
}

export function POST(request: Request) {
  return handleLaunchGuardSmsTest(request)
}
