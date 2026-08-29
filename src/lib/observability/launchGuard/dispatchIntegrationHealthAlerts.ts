import 'server-only'

import * as Sentry from '@sentry/nextjs'
import type { IntegrationHealthAlertInstruction } from './planIntegrationHealthAlerts'
import { postgresIntegrationHealthStore } from './postgresIntegrationHealthStore'
import { sendTwilioLaunchGuardSms } from './twilioLaunchGuardSms'

type Store = Pick<
  typeof postgresIntegrationHealthStore,
  | 'hasDeliveredTwilioTest'
  | 'reserveDelivery'
  | 'updateDelivery'
>

type Dependencies = {
  captureMessage: typeof Sentry.captureMessage
  environment: Readonly<Record<string, string | undefined>>
  fetch: typeof fetch
  flush: typeof Sentry.flush
  now: () => Date
  sendSms: typeof sendTwilioLaunchGuardSms
  store: Store
}

const defaultDependencies: Dependencies = {
  captureMessage: Sentry.captureMessage,
  environment: process.env,
  fetch,
  flush: Sentry.flush,
  now: () => new Date(),
  sendSms: sendTwilioLaunchGuardSms,
  store: postgresIntegrationHealthStore
}

function safeCode(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9:_-]/gu, '_')
    .slice(0, 120)
}

export async function dispatchIntegrationHealthAlerts(
  alerts: readonly IntegrationHealthAlertInstruction[],
  dependencies: Dependencies = defaultDependencies
) {
  const summary = {
    codexPending: 0,
    failed: 0,
    sentrySent: 0,
    suppressed: 0,
    twilioSent: 0
  }
  let twilioTestDelivered: boolean | undefined

  for (const alert of alerts) {
    const now = dependencies.now()

    for (const channel of alert.channels) {
      const deliveryId = await dependencies.store.reserveDelivery({
        channel,
        currentOpenedAt: alert.currentOpenedAt,
        fingerprint: alert.fingerprint,
        incidentId: alert.incidentId,
        kind: alert.kind,
        now
      })
      if (!deliveryId) continue

      if (channel === 'codex') {
        summary.codexPending += 1
        continue
      }

      if (channel === 'sentry') {
        try {
          const providerReceiptId = dependencies.captureMessage(
            `Launch guard ${safeCode(alert.kind)}: ${safeCode(
              alert.summaryCode
            )}`,
            {
              fingerprint: [
                'launch-guard',
                safeCode(alert.fingerprint),
                alert.kind
              ],
              level:
                alert.severity === 'critical' ||
                alert.severity === 'high' ?
                  'error'
                : 'warning',
              tags: {
                alert_kind: alert.kind,
                integration: safeCode(alert.integration),
                severity: alert.severity,
                surface: safeCode(alert.surface)
              }
            }
          )
          const flushed = await dependencies.flush(1_500)
          if (!flushed) throw new Error('sentry_flush_failed')
          await dependencies.store.updateDelivery({
            deliveryId,
            now,
            ...(providerReceiptId ? { providerReceiptId } : {}),
            status: 'sent'
          })
          summary.sentrySent += 1
        } catch {
          await dependencies.store.updateDelivery({
            deliveryId,
            failureCode: 'sentry_delivery_failed',
            now,
            status: 'failed'
          })
          summary.failed += 1
        }
        continue
      }

      twilioTestDelivered ??=
        await dependencies.store.hasDeliveredTwilioTest()
      if (!twilioTestDelivered) {
        await dependencies.store.updateDelivery({
          deliveryId,
          failureCode: 'controlled_sms_test_not_delivered',
          now,
          status: 'suppressed'
        })
        summary.suppressed += 1
        continue
      }

      const result = await dependencies.sendSms({
        environment: dependencies.environment,
        fetch: dependencies.fetch,
        message: {
          deliveryId,
          integration: alert.integration,
          kind: alert.kind,
          severity: alert.severity,
          summaryCode: alert.summaryCode,
          surface: alert.surface
        }
      })
      if (result.status === 'sent') {
        await dependencies.store.updateDelivery({
          deliveryId,
          now,
          providerReceiptId: result.providerReceiptId,
          status: 'sent'
        })
        summary.twilioSent += 1
      } else {
        await dependencies.store.updateDelivery({
          deliveryId,
          failureCode: result.code,
          now,
          status:
            result.status === 'suppressed' ? 'suppressed' : 'failed'
        })
        if (result.status === 'suppressed') {
          summary.suppressed += 1
        } else {
          summary.failed += 1
        }
      }
    }
  }

  return summary
}
