import type { ServerEvent } from 'facebook-nodejs-business-sdk'
import { buildMetaStandardEventFieldReport } from '@/lib/analytics/server/metaStandardEventFieldReport'
import { logToAppLogs } from '@/lib/utils/logToAppLogs'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function logMetaStandardEventDrain(
  event: ServerEvent
): Promise<void> {
  try {
    const report = buildMetaStandardEventFieldReport(
      event.normalize() as Record<string, unknown>
    )
    if (!report) return

    await logToAppLogs({
      context: {},
      data: {
        canonicalEventName: report.canonicalEventName,
        complete: report.complete,
        eventId: report.eventId,
        eventName: report.eventName,
        hasClientIp: report.hasClientIp,
        hasClientUserAgent: report.hasClientUserAgent,
        hasEmail: report.hasEmail,
        hasEventSourceUrl: report.hasEventSourceUrl,
        hasExternalId: report.hasExternalId,
        hasFbc: report.hasFbc,
        hasFbp: report.hasFbp,
        hasOrderId: report.hasOrderId,
        hasPhone: report.hasPhone,
        hasUserData: report.hasUserData,
        missingParameters: report.missingParameters,
        presentParameters: report.presentParameters,
        recommendedMissing: report.recommendedMissing,
        requiredParameters: report.requiredParameters
      },
      event: 'meta_capi.standard_event',
      eventName: report.canonicalEventName,
      level: report.complete ? 'INFO' : 'WARN',
      ...(uuidPattern.test(report.eventId) ?
        { eventId: report.eventId }
      : {}),
      adPlatformEvents: {
        meta: {
          eventName: report.eventName,
          requiredParameters: report.requiredParameters,
          transport: report.transport,
          parameters: report.parameters
        }
      }
    })
  } catch {
    try {
      console.warn(
        JSON.stringify({
          event: 'meta_capi.standard_event_log_failed'
        })
      )
    } catch {}
  }
}
