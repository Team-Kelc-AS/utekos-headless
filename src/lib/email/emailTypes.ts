import type { ServerContactFormData } from '@/db/zod/schemas/ServerContactFormSchema'
import type { ProductWaitlistData } from '@/db/zod/schemas/ProductWaitlistSchema'

export type TransactionalEmailType =
  | 'contact_notification'
  | 'product_waitlist'
  | 'newsletter_welcome'
  | 'campaign_lead'

export type ContactNotificationPayload = {
  type: 'contact_notification'
  submission: ServerContactFormData
  submissionId: string
}

export type ProductWaitlistPayload = {
  type: 'product_waitlist'
  submission: ProductWaitlistData
}

export type NewsletterWelcomePayload = {
  type: 'newsletter_welcome'
  email: string
}

export type CampaignLeadPayload = {
  type: 'campaign_lead'
  campaignSlug: string
  name: string
  email: string
  message?: string
  submissionId: string
}

export type TransactionalEmailPayload =
  | ContactNotificationPayload
  | ProductWaitlistPayload
  | NewsletterWelcomePayload
  | CampaignLeadPayload

export type TransactionalEmailFailureReason =
  | 'already_registered'
  | 'provider_rejected'

export type SendTransactionalEmailResult =
  | { ok: true; id: string }
  | {
      ok: false
      message: string
      reason: TransactionalEmailFailureReason
    }
