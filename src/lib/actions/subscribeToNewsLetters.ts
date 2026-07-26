'use server'

import crypto from 'node:crypto'

import { z } from 'zod'

import { NEWSLETTER_DISCOUNT_CODE } from '@/components/newsletter-modal/newsletterModalConfig'
import type { GenerateLeadDataLayerEvent } from '@/lib/analytics/generateLeadEvent'
import { parseLeadFormTrackingContext } from '@/lib/analytics/leadFormTrackingContext'
import { sendWelcomeEmail } from '@/lib/email/sendWelcomeEmail'
import {
  LEAD_FORM_IDS,
  LEAD_SOURCES,
  LEAD_TYPES
} from '@/lib/leads/leadFormIds'
import { recordLeadSubmission } from '@/lib/leads/recordLeadSubmission'
import { classifyOperationalFailure } from '@/lib/observability/logging/appLogContract'
import { syncSubscriberToShopify } from '@/lib/shopify/syncSubscriberToShopify'
import { logToAppLogs } from '@/lib/utils/logToAppLogs'

export type ActionState = {
  status: 'success' | 'error' | 'idle'
  message: string
  eventId?: string
  dataLayerEvent?: GenerateLeadDataLayerEvent
}

const emailSchema = z
  .string()
  .trim()
  .email({
    message: 'Vennligst skriv inn en gyldig e-postadresse.'
  })

export async function subscribeToNewsletter(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const emailResult = emailSchema.safeParse(
    formData.get('email')
  )

  if (!emailResult.success) {
    const message =
      emailResult.error.issues[0]?.message ??
      'Det oppstod en valideringsfeil.'

    return { status: 'error', message }
  }

  const email = emailResult.data.toLowerCase()

  const trackingContext = parseLeadFormTrackingContext(
    formData.get('leadTrackingContext')
  )

  const leadId = crypto.randomUUID()

  try {
    const [welcomeEmailResult, shopifySyncResult] =
      await Promise.allSettled([
        sendWelcomeEmail(email),
        syncSubscriberToShopify(email)
      ])

    if (shopifySyncResult.status === 'rejected') {
      console.error('Newsletter Shopify sync failed')

      await logToAppLogs({
        event: 'newsletter.shopify_sync_failed',
        level: 'ERROR',
        data: {
          reasonCode: classifyOperationalFailure(
            shopifySyncResult.reason
          )
        },
        context: {}
      })
    }

    let welcomeEmailFailure: string | null = null

    if (welcomeEmailResult.status === 'rejected') {
      welcomeEmailFailure = String(welcomeEmailResult.reason)
    } else if (!welcomeEmailResult.value.ok) {
      if (
        welcomeEmailResult.value.reason === 'already_registered'
      ) {
        return {
          status: 'error',
          message:
            'Denne e-postadressen er allerede registrert. Rabattmailen er sendt tidligere – sjekk innboksen og søppelpostmappen.'
        }
      }

      welcomeEmailFailure = welcomeEmailResult.value.message
    }

    if (welcomeEmailFailure) {
      console.error('Newsletter welcome email failed')

      await logToAppLogs({
        event: 'newsletter.welcome_email_failed',
        level: 'ERROR',
        data: {
          reasonCode: classifyOperationalFailure(
            welcomeEmailFailure
          )
        },
        context: {}
      })

      return {
        status: 'error',
        message:
          'Vi klarte ikke å sende rabattmailen. Prøv igjen om litt.'
      }
    }

    const leadResult = await recordLeadSubmission({
      leadId,
      email,
      formId: LEAD_FORM_IDS.newsletterSignup,
      leadType: LEAD_TYPES.newsletter,
      source: LEAD_SOURCES.newsletterSignup,
      ...(trackingContext ? { trackingContext } : {})
    })

    await logToAppLogs({
      event: 'newsletter.completed',
      level: 'INFO',
      data: {},
      context: {}
    })

    return {
      status: 'success',
      message: `Takk! Rabattkoden ${NEWSLETTER_DISCOUNT_CODE} er klar til bruk og på vei til innboksen din.`,
      ...(leadResult.eventId ?
        { eventId: leadResult.eventId }
      : {}),
      ...(leadResult.dataLayerEvent ?
        { dataLayerEvent: leadResult.dataLayerEvent }
      : {})
    }
  } catch (error: unknown) {
    console.error('Critical newsletter error')

    await logToAppLogs({
      event: 'newsletter.exception',
      level: 'ERROR',
      data: { reasonCode: classifyOperationalFailure(error) },
      context: {}
    })

    return {
      status: 'error',
      message: 'Noe gikk galt. Prøv igjen senere.'
    }
  }
}
