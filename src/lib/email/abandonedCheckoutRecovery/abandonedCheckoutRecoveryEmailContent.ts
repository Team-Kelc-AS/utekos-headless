import { z } from 'zod'

const inputSchema = z.strictObject({
  step: z.number().int().min(1).max(3),
  recoveryUrl: z.string().url().max(4096),
  unsubscribeUrl: z.string().url().max(4096)
})

const contentByStep = {
  1: {
    subject: 'Du har varer som venter hos Utekos',
    heading: 'Vil du fortsette der du slapp?',
    body: 'Vi har tatt vare på handlekurven din, slik at du enkelt kan fortsette utsjekkingen.'
  },
  2: {
    subject: 'Trenger du hjelp med bestillingen din?',
    heading: 'Kan vi hjelpe deg?',
    body: 'Handlekurven din er fortsatt tilgjengelig. Har du spørsmål om produktene eller bestillingen, hjelper vi deg gjerne.'
  },
  3: {
    subject: 'Siste påminnelse om handlekurven din',
    heading: 'En siste påminnelse',
    body: 'Dette er den siste e-posten vi sender om denne handlekurven. Du kan fortsatt gå tilbake og fullføre bestillingen.'
  }
} as const

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export type AbandonedCheckoutRecoveryEmailContent = {
  subject: string
  html: string
  text: string
}

export function getAbandonedCheckoutRecoveryEmailContent(
  input: {
    step: number
    recoveryUrl: string
    unsubscribeUrl: string
  }
): AbandonedCheckoutRecoveryEmailContent {
  const parsed = inputSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error(
      'abandoned_checkout_recovery_email_content_invalid'
    )
  }

  const content = contentByStep[parsed.data.step as 1 | 2 | 3]
  const safeRecoveryUrl = escapeHtml(parsed.data.recoveryUrl)
  const safeUnsubscribeUrl = escapeHtml(parsed.data.unsubscribeUrl)
  const footer =
    'Du mottar denne e-posten fordi du startet en utsjekking hos Utekos og har samtykket til markedsføring.'

  return {
    subject: content.subject,
    html: [
      '<!doctype html><html lang="nb"><body>',
      `<h1>${content.heading}</h1>`,
      `<p>${content.body}</p>`,
      `<p><a href="${safeRecoveryUrl}">Fortsett utsjekkingen</a></p>`,
      '<p>Trenger du hjelp? Svar på denne e-posten, så hjelper vi deg.</p>',
      `<p><small><a href="${safeUnsubscribeUrl}">Meld deg av slike e-poster</a></small></p>`,
      `<p><small>${footer}</small></p>`,
      '</body></html>'
    ].join(''),
    text: [
      content.heading,
      '',
      content.body,
      '',
      `Fortsett utsjekkingen: ${parsed.data.recoveryUrl}`,
      '',
      'Trenger du hjelp? Svar på denne e-posten, så hjelper vi deg.',
      '',
      `Meld deg av slike e-poster: ${parsed.data.unsubscribeUrl}`,
      '',
      footer
    ].join('\n')
  }
}
