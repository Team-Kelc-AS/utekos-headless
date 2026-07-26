import crypto from 'node:crypto'
import type { ServerContactFormData } from '@/db/zod/schemas/ServerContactFormSchema'
import { logToAppLogs } from '@/lib/utils/logToAppLogs'
import { z } from 'zod'

const atlasIngestConfigSchema = z.strictObject({
  enabled: z.enum(['true', 'false']).default('false'),
  ingestUrl: z.url(),
  ingestSecret: z.string().trim().min(16)
})

export function isCustomerServiceAtlasIngestEnabled(
  value: string | undefined
): boolean {
  return (
    z.enum(['true', 'false']).default('false').safeParse(value)
      .data === 'true'
  )
}

export async function forwardContactSubmissionToAtlas({
  submission,
  resendNotificationId
}: {
  submission: ServerContactFormData
  resendNotificationId?: string
}) {
  const enabled = isCustomerServiceAtlasIngestEnabled(
    process.env.CUSTOMER_SERVICE_ATLAS_INGEST_ENABLED
  )

  if (!enabled) {
    await logToAppLogs({
      event: 'contact.atlas_skipped',
      level: 'INFO',
      data: { reasonCode: 'disabled' },
      context: {}
    })
    return
  }

  const config = atlasIngestConfigSchema.safeParse({
    enabled: process.env.CUSTOMER_SERVICE_ATLAS_INGEST_ENABLED,
    ingestUrl: process.env.CUSTOMER_SERVICE_ATLAS_INGEST_URL,
    ingestSecret:
      process.env.CUSTOMER_SERVICE_ATLAS_INGEST_SECRET
  })

  if (!config.success) {
    await logToAppLogs({
      event: 'contact.atlas_skipped',
      level: 'INFO',
      data: { reasonCode: 'missing_configuration' },
      context: {}
    })
    return
  }

  const payload = {
    sourceSubmissionId:
      resendNotificationId ?? crypto.randomUUID(),
    name: submission.name,
    email: submission.email,
    country: submission.country,
    message: submission.message,
    submittedAt: new Date().toISOString(),
    ...(submission.phone ? { phone: submission.phone } : {}),
    ...(submission.orderNumber ?
      { orderNumber: submission.orderNumber }
    : {}),
    ...(resendNotificationId ? { resendNotificationId } : {})
  }

  try {
    const response = await fetch(config.data.ingestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-utekos-atlas-ingest-secret': config.data.ingestSecret
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      await logToAppLogs({
        event: 'contact.atlas_failed',
        level: 'ERROR',
        data: { statusCode: response.status },
        context: {}
      })
      return
    }

    await logToAppLogs({
      event: 'contact.atlas_forwarded',
      level: 'INFO',
      data: {},
      context: {}
    })
  } catch {
    await logToAppLogs({
      event: 'contact.atlas_exception',
      level: 'ERROR',
      data: { reasonCode: 'network' },
      context: {}
    })
  }
}
