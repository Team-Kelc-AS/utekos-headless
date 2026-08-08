import {
  returnPolicy,
  returnPolicyCopy
} from '@/lib/policies/returnPolicy'

export function renderShopifyRefundPolicyHtml() {
  const address = returnPolicy.returnAddress

  return [
    '<h2>Angrerett og retur</h2>',
    `<p>${returnPolicyCopy.summary}</p>`,
    '<h3>Slik bruker du angreretten</h3>',
    '<ol>',
    `<li>${returnPolicyCopy.notice} Send meldingen til <a href="mailto:${returnPolicy.contactEmail}">${returnPolicy.contactEmail}</a>.</li>`,
    `<li>${returnPolicyCopy.returnDeadline}</li>`,
    `<li>${returnPolicyCopy.returnShipping}</li>`,
    '</ol>',
    '<h3>Returadresse</h3>',
    `<p>${address.recipient}<br>${address.streetAddress}<br>${address.postalCode} ${address.addressLocality}<br>Norge</p>`,
    '<h3>Refusjon</h3>',
    `<p>${returnPolicyCopy.refund}</p>`,
    `<p>${returnPolicyCopy.refundTiming}</p>`,
    '<h3>Varens tilstand og verdireduksjon</h3>',
    `<p>${returnPolicyCopy.condition}</p>`,
    '<h3>Unntak</h3>',
    `<p>${returnPolicyCopy.exceptions}</p>`,
    '<h3>Reklamasjon, skade eller feilsendt vare</h3>',
    `<p>${returnPolicyCopy.complaint}</p>`,
    `<p>Sist oppdatert: ${returnPolicy.lastUpdatedLabel}</p>`
  ].join('')
}
