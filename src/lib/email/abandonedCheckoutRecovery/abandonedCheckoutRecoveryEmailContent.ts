import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

const EMAIL_TEMPLATE = readFileSync(
  fileURLToPath(
    new URL(
      './abandonedCheckoutRecoveryEmailContent.html',
      import.meta.url
    )
  ),
  'utf8'
)

const firstPartyImageUrlSchema = z
  .string()
  .url()
  .max(2048)
  .refine(value => {
    let url: URL

    try {
      url = new URL(value)
    } catch {
      return false
    }

    return (
      url.protocol === 'https:'
      && url.hostname === 'utekos.no'
      && url.username === ''
      && url.password === ''
    )
  })

const lineItemSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  quantity: z.number().int().min(1).max(99),
  priceLabel: z.string().trim().min(1).max(40),
  imageUrl: firstPartyImageUrlSchema.nullable()
})

const inputSchema = z.strictObject({
  step: z.number().int().min(1).max(3),
  recoveryUrl: z.string().url().max(4096),
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
    subject: 'Et gavekort på 10 % venter på deg',
    preheader: 'Bruk det på neste kjøp, eller gi det bort',
    heading: '10 % å bruke eller gi bort',
    body: 'Handlekurven din venter fortsatt. Vi har et gavekort på 10 % klart til deg. Bruk det på neste kjøp, eller gi det til noen du vil varme.',
    ctaLabel: 'Hent gavekortet'
  },
  3: {
    subject: '50 % på Comfyrobe og 10 % i gavekort',
    preheader: 'Siste e-post om denne handlekurven',
    heading: 'Siste mulighet i denne runden',
    body: 'Dette er den siste e-posten om denne handlekurven. Fullfør bestillingen og få 50 % på Comfyrobe, pluss et gavekort med 10 % rabatt.',
    ctaLabel: 'Hent tilbudene'
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
            `<img src="${escapeHtml(lineItem.imageUrl)}" alt="${safeTitle}" width="72" height="72" border="0" style="display:block;border-width:0;outline:none;text-decoration:none;border-radius:8px;width:72px;height:72px;" />`,
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

function buildOfferCardHtml(title: string, body: string): string {
  return [
    '<table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:16px;">',
    '<tr>',
    '<td bgcolor="#012622" style="background-color:#012622;border-width:1px;border-style:solid;border-color:#00453e;border-radius:12px;padding-top:16px;padding-right:16px;padding-bottom:16px;padding-left:16px;">',
    `<p style="margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-size:20px;line-height:26px;font-weight:700;color:#f0eee9;text-align:center;">${title}</p>`,
    `<p style="margin-top:8px;margin-right:0;margin-bottom:0;margin-left:0;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;font-size:14px;line-height:21px;font-weight:400;color:#d6e3e1;text-align:center;">${body}</p>`,
    '</td>',
    '</tr>',
    '</table>'
  ].join('')
}

function buildOfferHtml(step: 1 | 2 | 3): string {
  switch (step) {
    case 1:
      return ''
    case 2:
      return buildOfferCardHtml(
        'Gavekort 10 %',
        'Gjelder neste kjøp hos Utekos. Du kan også gi det bort.'
      )
    case 3:
      return [
        buildOfferCardHtml(
          '50 % på Comfyrobe',
          'Rabatten gjelder Comfyrobe når du fullfører utsjekkingen.'
        ),
        buildOfferCardHtml(
          'Gavekort 10 %',
          'Bruk det på et senere kjøp, eller gi det bort.'
        )
      ].join('')
    default: {
      const exhaustive: never = step
      throw new Error(
        `abandoned_checkout_recovery_offer_unhandled:${String(exhaustive)}`
      )
    }
  }
}

function buildOfferText(step: 1 | 2 | 3): string {
  switch (step) {
    case 1:
      return ''
    case 2:
      return [
        'Gavekort 10 %',
        'Gjelder neste kjøp hos Utekos. Du kan også gi det bort.'
      ].join('\n')
    case 3:
      return [
        '50 % på Comfyrobe',
        'Rabatten gjelder Comfyrobe når du fullfører utsjekkingen.',
        '',
        'Gavekort 10 %',
        'Bruk det på et senere kjøp, eller gi det bort.'
      ].join('\n')
    default: {
      const exhaustive: never = step
      throw new Error(
        `abandoned_checkout_recovery_offer_unhandled:${String(exhaustive)}`
      )
    }
  }
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
  const offerText = buildOfferText(step)

  return {
    subject: content.subject,
    html: applyTemplate(EMAIL_TEMPLATE, {
      PREHEADER: escapeHtml(content.preheader),
      HEADING: escapeHtml(content.heading),
      BODY: escapeHtml(content.body),
      OFFER: buildOfferHtml(step),
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
      offerText,
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
