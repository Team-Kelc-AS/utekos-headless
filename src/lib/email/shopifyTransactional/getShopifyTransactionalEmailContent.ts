import { z } from 'zod'

import type {
  ShopifyTransactionalEmailNotificationType
} from './shopifyTransactionalEmailEvidenceContract'
import type {
  ShopifyTransactionalEmailOrder
} from './fetchShopifyTransactionalEmailOrder'

const inputSchema = z.strictObject({
  notificationType: z.enum([
    'order_confirmation',
    'shipping_confirmation',
    'shipment_out_for_delivery',
    'shipment_delivered'
  ]),
  order: z.custom<ShopifyTransactionalEmailOrder>()
})

const copyByType: Record<
  ShopifyTransactionalEmailNotificationType,
  {
    subject: (orderName: string) => string
    heading: string
    body: string
    button: string
  }
> = {
  order_confirmation: {
    subject: orderName => `Vi har mottatt bestilling ${orderName}`,
    heading: 'Takk for bestillingen',
    body: 'Vi har mottatt bestillingen din og gir beskjed når den er på vei.',
    button: 'Se bestillingen'
  },
  shipping_confirmation: {
    subject: orderName => `Bestilling ${orderName} er sendt`,
    heading: 'Bestillingen er på vei',
    body: 'Pakken er sendt. Du finner oppdatert leveringsinformasjon på bestillingssiden.',
    button: 'Følg bestillingen'
  },
  shipment_out_for_delivery: {
    subject: orderName => `${orderName} er ute til levering`,
    heading: 'Pakken kommer snart',
    body: 'Pakken er ute til levering. Se siste status på bestillingssiden.',
    button: 'Se leveringsstatus'
  },
  shipment_delivered: {
    subject: orderName => `${orderName} er levert`,
    heading: 'Bestillingen er levert',
    body: 'Transportøren har registrert pakken som levert. Vi håper du blir fornøyd.',
    button: 'Se bestillingen'
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function formatMoney(amount: string, currencyCode: string): string {
  const numericAmount = Number(amount)

  if (!Number.isFinite(numericAmount)) {
    throw new Error(
      'shopify_transactional_email_amount_invalid'
    )
  }

  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: currencyCode
  }).format(numericAmount)
}

export function getShopifyTransactionalEmailContent(
  input: {
    notificationType: ShopifyTransactionalEmailNotificationType
    order: ShopifyTransactionalEmailOrder
  }
) {
  const parsed = inputSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(
      'shopify_transactional_email_content_invalid'
    )
  }

  const { notificationType, order } = parsed.data
  const copy = copyByType[notificationType]
  const safeOrderName = escapeHtml(order.name)
  const safeStatusPageUrl = escapeHtml(order.statusPageUrl)
  const total = formatMoney(
    order.currentTotalPriceSet.presentmentMoney.amount,
    order.currentTotalPriceSet.presentmentMoney.currencyCode
  )
  const itemRows = order.lineItems.nodes.map(item => {
    const variant = item.variantTitle
      && item.variantTitle !== 'Default Title'
      ? ` · ${item.variantTitle}`
      : ''
    const label = `${item.title}${variant}`
    const lineTotal = formatMoney(
      item.discountedTotalSet.presentmentMoney.amount,
      item.discountedTotalSet.presentmentMoney.currencyCode
    )

    return [
      '<tr>',
      `<td style="padding:10px 0;color:#f0eee9;font-size:15px;line-height:22px;">${escapeHtml(label)} × ${String(item.quantity)}</td>`,
      `<td align="right" style="padding:10px 0;color:#f0eee9;font-size:15px;line-height:22px;white-space:nowrap;">${escapeHtml(lineTotal)}</td>`,
      '</tr>'
    ].join('')
  }).join('')
  const itemText = order.lineItems.nodes.map(item => {
    const variant = item.variantTitle
      && item.variantTitle !== 'Default Title'
      ? ` · ${item.variantTitle}`
      : ''
    const lineTotal = formatMoney(
      item.discountedTotalSet.presentmentMoney.amount,
      item.discountedTotalSet.presentmentMoney.currencyCode
    )
    return `${item.title}${variant} × ${String(item.quantity)} — ${lineTotal}`
  }).join('\n')

  return {
    subject: copy.subject(order.name),
    html: [
      '<!doctype html><html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>',
      '<body style="margin:0;background:#001f1c;color:#f0eee9;font-family:Arial,sans-serif;">',
      '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">',
      escapeHtml(copy.body),
      '</div>',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#001f1c;">',
      '<tr><td align="center" style="padding:28px 14px;">',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#012622;border:1px solid #23534e;border-radius:16px;">',
      '<tr><td style="padding:32px 28px;">',
      '<p style="margin:0 0 24px;color:#f0eee9;font-size:22px;font-weight:700;">UTEKOS</p>',
      `<h1 style="margin:0 0 14px;color:#f0eee9;font-size:30px;line-height:37px;">${escapeHtml(copy.heading)}</h1>`,
      `<p style="margin:0 0 24px;color:#d6e3e1;font-size:17px;line-height:26px;">${escapeHtml(copy.body)}</p>`,
      `<p style="margin:0 0 14px;color:#f0eee9;font-size:16px;font-weight:700;">Bestilling ${safeOrderName}</p>`,
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">',
      itemRows,
      `<tr><td style="padding:16px 0 0;border-top:1px solid #45726d;color:#f0eee9;font-size:17px;font-weight:700;">Totalt</td><td align="right" style="padding:16px 0 0;border-top:1px solid #45726d;color:#f0eee9;font-size:17px;font-weight:700;white-space:nowrap;">${escapeHtml(total)}</td></tr>`,
      '</table>',
      '<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;"><tr>',
      `<td bgcolor="#f0eee9" style="border-radius:8px;"><a href="${safeStatusPageUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 22px;color:#001f1c;font-size:16px;font-weight:700;text-decoration:none;">${escapeHtml(copy.button)}</a></td>`,
      '</tr></table>',
      '<p style="margin:28px 0 0;color:#b8cfcc;font-size:13px;line-height:20px;">Dette er en transaksjonsmelding om bestillingen din. Svar på e-posten dersom du trenger hjelp.</p>',
      '</td></tr></table>',
      '</td></tr></table>',
      '</body></html>'
    ].join(''),
    text: [
      copy.heading,
      '',
      copy.body,
      '',
      `Bestilling ${order.name}`,
      itemText,
      `Totalt: ${total}`,
      '',
      `${copy.button}: ${order.statusPageUrl}`,
      '',
      'Dette er en transaksjonsmelding om bestillingen din. Svar på e-posten dersom du trenger hjelp.'
    ].join('\n')
  }
}
