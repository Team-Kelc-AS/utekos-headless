'use server'

import 'server-only'

import crypto from 'node:crypto'

import {
  ProductWaitlistSchema,
  type ProductWaitlistData
} from '@/db/zod/schemas/ProductWaitlistSchema'
import type { GenerateLeadDataLayerEvent } from '@/lib/analytics/generateLeadEvent'
import { parseLeadFormTrackingContext } from '@/lib/analytics/leadFormTrackingContext'
import { sendProductWaitlistNotification } from '@/lib/email/sendProductWaitlistNotification'
import {
  LEAD_FORM_IDS,
  LEAD_SOURCES,
  LEAD_TYPES
} from '@/lib/leads/leadFormIds'
import { recordLeadSubmission } from '@/lib/leads/recordLeadSubmission'
import { classifyOperationalFailure } from '@/lib/observability/logging/appLogContract'
import { logToAppLogs } from '@/lib/utils/logToAppLogs'
import { z } from 'zod'

export type ProductWaitlistActionState = {
  status: 'idle' | 'success' | 'error'
  message: string
  errors?: Partial<Record<keyof ProductWaitlistData, string[]>>
  eventId?: string
  dataLayerEvent?: GenerateLeadDataLayerEvent
}

export async function submitProductWaitlist(
  _previousState: ProductWaitlistActionState,
  formData: FormData
): Promise<ProductWaitlistActionState> {
  const rawFormData = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    productHandle: formData.get('productHandle'),
    privacy: formData.get('privacy') === 'on',
    website: formData.get('website') ?? ''
  }

  const result = ProductWaitlistSchema.safeParse(rawFormData)

  if (!result.success) {
    return {
      status: 'error',
      message: 'Kontroller feltene og prøv igjen.',
      errors: z.flattenError(result.error).fieldErrors
    }
  }

  if (result.data.website) {
    return {
      status: 'success',
      message: 'Takk! Du står nå på ventelisten.'
    }
  }

  const trackingContext = parseLeadFormTrackingContext(
    formData.get('leadTrackingContext')
  )
  const leadId = crypto.randomUUID()

  try {
    const sendResult = await sendProductWaitlistNotification(
      result.data
    )

    if (!sendResult.ok) {
      throw new Error(sendResult.message)
    }

    await logToAppLogs({
      event: 'waitlist.submitted',
      level: 'INFO',
      data: { productHandle: result.data.productHandle },
      context: {}
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error'

    await logToAppLogs({
      event: 'waitlist.send_failed',
      level: 'ERROR',
      data: {
        reasonCode: classifyOperationalFailure(error),
        productHandle: result.data.productHandle
      },
      context: {}
    })

    if (
      message.includes('CONTACT_FORM_SEND_TO_EMAIL') ||
      message.includes('Invalid Resend email configuration')
    ) {
      return {
        status: 'error',
        message:
          'Ventelisten er midlertidig utilgjengelig. Prøv igjen litt senere.'
      }
    }

    return {
      status: 'error',
      message:
        'Vi fikk ikke registrert deg akkurat nå. Prøv igjen litt senere.'
    }
  }

  const leadResult = await recordLeadSubmission({
    leadId,
    email: result.data.email,
    firstName: result.data.name,
    phone: result.data.phone,
    formId: LEAD_FORM_IDS.productWaitlistUtekosDun,
    leadType: LEAD_TYPES.productWaitlist,
    source: LEAD_SOURCES.productWaitlistUtekosDun,
    productHandle: result.data.productHandle,
    ...(trackingContext ? { trackingContext } : {})
  })

  return {
    status: 'success',
    message:
      'Takk! Du står nå på ventelisten. Vi kontakter deg når Utekos Dun er tilbake.',
    ...(leadResult.eventId ?
      { eventId: leadResult.eventId }
    : {}),
    ...(leadResult.dataLayerEvent ?
      { dataLayerEvent: leadResult.dataLayerEvent }
    : {})
  }
}
