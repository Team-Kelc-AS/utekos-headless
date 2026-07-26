// Path: src/lib/actions/submitContactForm.ts
'use server'
import 'server-only'

import crypto from 'node:crypto'

import { ServerContactFormSchema } from '@/db/zod/schemas/ServerContactFormSchema'
import { forwardContactSubmissionToAtlas } from '@/lib/actions/forwardContactSubmissionToAtlas'
import { sendContactNotification } from '@/lib/email/sendContactNotification'
import { classifyOperationalFailure } from '@/lib/observability/logging/appLogContract'
import { logToAppLogs } from '@/lib/utils/logToAppLogs'
import { z } from 'zod'

export interface ContactFormState {
  message: string
  errors?: {
    name?: string[]
    email?: string[]
    phone?: string[]
    country?: string[]
    orderNumber?: string[]
    message?: string[]
    privacy?: string[]
  }
}

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const rawFormData = {
    ...Object.fromEntries(formData.entries()),
    privacy: formData.get('privacy') === 'on'
  }

  if ('phone' in rawFormData && rawFormData.phone === '')
    delete (rawFormData as Record<string, unknown>).phone
  if (
    'orderNumber' in rawFormData &&
    rawFormData.orderNumber === ''
  )
    delete (rawFormData as Record<string, unknown>).orderNumber

  const result =
    await ServerContactFormSchema.safeParseAsync(rawFormData)

  if (!result.success) {
    const flattenedErrors = z.flattenError(result.error)
    return {
      message:
        'Validering feilet. Vennligst sjekk feltene og prøv igjen.',
      errors: flattenedErrors.fieldErrors
    }
  }

  const submissionId = crypto.randomUUID()

  try {
    const sendResult = await sendContactNotification({
      submission: result.data,
      submissionId
    })

    if (!sendResult.ok) {
      console.error('Contact form notification delivery failed')
      await logToAppLogs({
        event: 'contact.send_failed',
        level: 'ERROR',
        data: { reasonCode: 'provider_rejected' },
        context: {}
      })

      return {
        message:
          'Noe gikk galt under sending av e-post. Prøv igjen.'
      }
    }

    await logToAppLogs({
      event: 'contact.submitted',
      level: 'INFO',
      data: { delivery: 'resend' },
      context: {}
    })

    await forwardContactSubmissionToAtlas({
      submission: result.data,
      resendNotificationId: sendResult.id
    })

    return { message: 'Takk for din henvendelse!' }
  } catch (exception: unknown) {
    const message =
      exception instanceof Error ?
        exception.message
      : 'Unknown error'
    console.error('Contact form submission failed')

    await logToAppLogs({
      event: 'contact.exception',
      level: 'ERROR',
      data: {
        reasonCode: classifyOperationalFailure(exception)
      },
      context: {}
    })

    if (message.includes('CONTACT_FORM_SEND_TO_EMAIL')) {
      return {
        message:
          'Serverkonfigurasjonsfeil. Innsending er midlertidig utilgjengelig.'
      }
    }

    if (message.includes('Invalid Resend email configuration')) {
      return {
        message:
          'Serverkonfigurasjonsfeil. Innsending er midlertidig utilgjengelig.'
      }
    }

    return {
      message:
        'En uventet feil oppstod. Vennligst prøv igjen senere.'
    }
  }
}
