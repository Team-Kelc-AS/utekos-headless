import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import { isSafeAbandonedCheckoutRecoveryProductImageUrl } from './resolveAbandonedCheckoutRecoveryProductImageUrl'

const EMAIL_TEMPLATE = readFileSync(
  fileURLToPath(
    new URL(
      './abandonedCheckoutRecoveryEmailContent.html',
      import.meta.url
    )
  ),
  'utf8'
)

const publicProductImageUrlSchema = z
  .string()
  .url()
  .max(2048)
  .refine(isSafeAbandonedCheckoutRecoveryProductImageUrl)

const recoveryUrlSchema = z
  .string()
  .url()
  .max(4096)
  .refine(value => {
    const url = new URL(value)

    return url.protocol === 'https:'
      && url.username === ''
      && url.password === ''
      && url.port === ''
      && url.hash === ''
      && (
        [
          'checkout.shopify.com',
          'kasse.utekos.no',
          'utekos.no',
          'www.utekos.no'
        ].includes(url.hostname)
        || /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/u.test(
          url.hostname
        )
      )
  })

const lineItemSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  quantity: z.number().int().min(1).max(99),
  priceLabel: z.string().trim().min(1).max(40),
  imageUrl: publicProductImageUrlSchema.nullable()
})

const inputSchema = z.strictObject({
  step: z.number().int().min(1).max(3),
  recoveryUrl: recoveryUrlSchema,
  unsubscribeUrl: z.string().url().max(4096),
  lineItems: z.array(lineItemSchema).max(10)
})

const contentByStep = {
  1: {
    subject: 'Du har varer som venter hos Utekos',
    preheader: 'Vi har tatt vare på handlekurven din',
    heading: 'Handlekurven din er klar',
    body: 'Du startet en bestilling hos Utekos. Varene ligger fortsatt i kassen, klare når du er det.',
    ctaLabel: 'Fortsett utsjekkingen'
  },
  2: {
    subject: 'Handlekurven din venter fortsatt',
    preheader: 'Fortsett der du slapp hos Utekos',
    heading: 'Fortsatt interessert?',
    body: 'Vi har tatt vare på varene fra utsjekkingen din. Du kan gå tilbake til den samme kassen og fortsette der du slapp.',
    ctaLabel: 'Tilbake til kassen'
  },
  3: {
    subject: 'Siste påminnelse om handlekurven din',
    preheader: 'Siste e-post om denne handlekurven',
    heading: 'Siste påminnelse i denne runden',
    body: 'Dette er den siste e-posten om denne handlekurven. Dersom du fortsatt ønsker varene, kan du gå direkte tilbake til kassen.',
    ctaLabel: 'Åpne handlekurven'
  }
} as const

const FOOTER =
  'Du mottar denne e-posten fordi du startet en utsjekking hos Utekos og har samtykket til markedsføring.'

const TEMPLATE_PLACEHOLDER = /\{\{([A-Z_]+)\}\}/g

export type AbandonedCheckoutRecoveryEmailLineItem = z.infer<
  typeof lineItemSchema
>

export type AbandonedCheckoutRecoveryEmailContent = {
  subject: string
  html: string
  text: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function applyTemplate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(TEMPLATE_PLACEHOLDER, (_match, key: string) => {
    const value = values[key]

    if (value === undefined) {
      throw new Error(
        'abandoned_checkout_recovery_email_content_invalid'
      )
    }

    return value
  })
}

function buildLineItemsHtml(
  lineItems: readonly AbandonedCheckoutRecoveryEmailLineItem[],
  recoveryUrl: string
): string {
  if (lineItems.length === 0) {
    return ''
  }

  const rows = lineItems.map(lineItem => {
    const safeTitle = escapeHtml(lineItem.title)
    const safePrice = escapeHtml(lineItem.priceLabel)
    const quantityLabel = `Antall ${String(lineItem.quantity)}`
    const imageCell =
      lineItem.imageUrl === null
        ? ''
        : [
            '<td style="width:72px;padding-top:0;padding-right:12px;padding-bottom:16px;padding-left:0;vertical-align:top;">',
            `<a href="${recoveryUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">`,
            `<img src="${escapeHtml(lineItem.imageUrl)}" alt="${safeTitle}" width="72" height="72" border="0" style="display:block;border-width:0;outline:none;text-decoration:none;border-radius:8px;width:72px;max-width:100%;height:auto;" />`,
            '</a>',
            '</td>'
          ].join('')

    return [
      '<tr>',
      imageCell,
      '<td style="padding-top:0;padding-right:0;padding-bottom:16px;padding-left:0;vertical-align:top;">',
      `<a href="${recoveryUrl}" target="_blank" rel="noopener noreferrer" style="color:#f0eee9;text-decoration:none;">`,
      `<p style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-size:16px;line-height:22px;font-weight:600;color:#f0eee9;">${safeTitle}</p>`,
      '</a>',
      `<p style="margin-top:4px;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-size:14px;line-height:20px;font-weight:400;color:#d6e3e1;">${escapeHtml(quantityLabel)}</p>`,
      `<p style="margin-top:4px;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-size:16px;line-height:22px;font-weight:400;color:#f0eee9;">${safePrice}</p>`,
      '</td>',
      '</tr>'
    ].join('')
  })

  return [
    '<h2 style="margin-top:24px;margin-right:0;margin-bottom:16px;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-size:18px;line-height:24px;font-weight:600;color:#f0eee9;text-align:center;">Handlekurven din</h2>',
    '<table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation">',
    ...rows,
    '</table>'
  ].join('')
}

function buildLineItemsText(
  lineItems: readonly AbandonedCheckoutRecoveryEmailLineItem[]
): string {
  if (lineItems.length === 0) {
    return ''
  }

  return [
    'Handlekurven din',
    '',
    ...lineItems.flatMap(lineItem => [
      lineItem.title,
      `Antall ${String(lineItem.quantity)}`,
      lineItem.priceLabel,
      ''
    ])
  ].join('\n')
}

export function getAbandonedCheckoutRecoveryEmailContent(
  input: {
    step: number
    recoveryUrl: string
    unsubscribeUrl: string
    lineItems?: readonly AbandonedCheckoutRecoveryEmailLineItem[]
  }
): AbandonedCheckoutRecoveryEmailContent {
  const parsed = inputSchema.safeParse({
    ...input,
    lineItems: input.lineItems ?? []
  })

  if (!parsed.success) {
    throw new Error(
      'abandoned_checkout_recovery_email_content_invalid'
    )
  }

  const step = parsed.data.step as 1 | 2 | 3
  const content = contentByStep[step]
  const safeRecoveryUrl = escapeHtml(parsed.data.recoveryUrl)
  const safeUnsubscribeUrl = escapeHtml(parsed.data.unsubscribeUrl)
  const lineItemsHtml = buildLineItemsHtml(
    parsed.data.lineItems,
    safeRecoveryUrl
  )
  const lineItemsText = buildLineItemsText(parsed.data.lineItems)

  return {
    subject: content.subject,
    html: applyTemplate(EMAIL_TEMPLATE, {
      PREHEADER: escapeHtml(content.preheader),
      HEADING: escapeHtml(content.heading),
      BODY: escapeHtml(content.body),
      OFFER: '',
      CTA_LABEL: escapeHtml(content.ctaLabel),
      RECOVERY_URL: safeRecoveryUrl,
      LINE_ITEMS: lineItemsHtml,
      UNSUBSCRIBE_URL: safeUnsubscribeUrl
    }),
    text: [
      content.heading,
      '',
      content.body,
      '',
      lineItemsText,
      `${content.ctaLabel}: ${parsed.data.recoveryUrl}`,
      '',
      'Trenger du hjelp? Svar på denne e-posten, så hjelper vi deg.',
      '',
      `Meld deg av slike e-poster: ${parsed.data.unsubscribeUrl}`,
      '',
      FOOTER
    ]
      .filter((part, index, parts) => {
        if (part !== '') {
          return true
        }

        return parts[index - 1] !== ''
      })
      .join('\n')
      .trim()
  }
}
