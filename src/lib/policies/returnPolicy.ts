export type ReturnPolicy = Readonly<{
  applicableCountry: 'NO'
  returnPolicyCountry: 'NO'
  returnWindowDays: 14
  returnAfterNoticeDays: 14
  processRefundBusinessDays: Readonly<{ minimum: 1; maximum: 3 }>
  contactEmail: 'kundeservice@utekos.no'
  pageUrl: 'https://utekos.no/frakt-og-retur'
  returnAddress: Readonly<{
    recipient: 'KELC AS (Utekos)'
    streetAddress: 'Lille Damsgårdsveien 25'
    postalCode: '5162'
    addressLocality: 'Laksevåg'
    addressCountry: 'NO'
  }>
  customerPaysReturnShipping: true
  customerCreatesReturnLabel: true
  acceptsExchanges: true
  lastUpdated: '2026-08-08'
  lastUpdatedLabel: '8. august 2026'
}>

export const returnPolicy = {
  applicableCountry: 'NO',
  returnPolicyCountry: 'NO',
  returnWindowDays: 14,
  returnAfterNoticeDays: 14,
  processRefundBusinessDays: { minimum: 1, maximum: 3 },
  contactEmail: 'kundeservice@utekos.no',
  pageUrl: 'https://utekos.no/frakt-og-retur',
  returnAddress: {
    recipient: 'KELC AS (Utekos)',
    streetAddress: 'Lille Damsgårdsveien 25',
    postalCode: '5162',
    addressLocality: 'Laksevåg',
    addressCountry: 'NO'
  },
  customerPaysReturnShipping: true,
  customerCreatesReturnLabel: true,
  acceptsExchanges: true,
  lastUpdated: '2026-08-08',
  lastUpdatedLabel: '8. august 2026'
} as const satisfies ReturnPolicy

export const returnPolicyCopy = {
  summary:
    'Du har 14 kalenderdagers angrerett fra dagen du fysisk mottar varen. Du betaler og ordner returfrakten selv.',
  notice:
    'Send en utvetydig angremelding på e-post før angrefristen utløper. Du trenger ikke oppgi noen grunn eller vente på godkjenning. Navn, ordrenummer og hvilke varer returen gjelder gjør behandlingen raskere, men er ikke vilkår for angreretten.',
  returnDeadline:
    'Send varen uten ugrunnet opphold og senest 14 kalenderdager etter at du ga oss beskjed om at du angrer.',
  returnShipping:
    'Du oppretter og betaler returfrakten selv. Pakk varen forsvarlig, bruk gjerne sporet sending og ta vare på innleveringskvitteringen som dokumentasjon.',
  refund:
    'Vi tilbakefører produktbetalingen og eventuell kostnad for ordinær utgående standardfrakt. Tillegg for en dyrere leveringsmåte du uttrykkelig valgte, refunderes ikke. Refusjonen skjer til samme betalingsmiddel uten refusjonsgebyr.',
  refundTiming:
    'Vi refunderer uten ugrunnet opphold og innen lovens frist. Vi initierer normalt refusjonen innen 1–3 virkedager etter at returen er mottatt og kontrollert. Vi kan holde tilbake betalingen til varen er mottatt, eller til du har dokumentert at den er sendt. Banken eller betalingsleverandøren kan bruke ekstra tid før beløpet vises på kontoen.',
  condition:
    'Du kan undersøke varen på samme måte som i en fysisk butikk. For full refusjon uten verdifradrag skal varen være ubrukt, uvasket og uendret, uten lukt eller flekker, og merkelappen skal være på. Håndtering utover det som er nødvendig for å fastslå varens art, egenskaper og funksjon kan gi et dokumentert fradrag for verdireduksjon, men angreretten avvises ikke automatisk.',
  exceptions:
    'Ingen av produktene i dagens aktive Utekos-sortiment har produktspesifikke unntak fra angreretten. Dersom et fremtidig produkt omfattes av et lovlig unntak, skal dette opplyses tydelig på produktsiden og før kjøpet gjennomføres.',
  complaint:
    'Reklamasjon på en mangelfull, skadet eller feilsendt vare behandles separat fra ordinær angrerett. Kontakt kundeservice før du sender varen. Ved en gyldig reklamasjon dekker Utekos nødvendig returfrakt, og dine lovfestede reklamasjonsrettigheter begrenses ikke.'
} as const

export const returnPolicyLlmsSummary = `Returpolicyen gjelder nettkjøp levert i Norge. Kunden har ${returnPolicy.returnWindowDays} kalenderdagers angrerett fra fysisk mottak og skal sende varen uten ugrunnet opphold, senest ${returnPolicy.returnAfterNoticeDays} dager etter angremeldingen. Kunden ordner og betaler ordinær returfrakt. Returadressen er ${returnPolicy.returnAddress.recipient}, ${returnPolicy.returnAddress.streetAddress}, ${returnPolicy.returnAddress.postalCode} ${returnPolicy.returnAddress.addressLocality}. Angremelding sendes til ${returnPolicy.contactEmail}. Utekos refunderer produktbetalingen og eventuell ordinær utgående standardfrakt og initierer refusjonen innen ${returnPolicy.processRefundBusinessDays.minimum}–${returnPolicy.processRefundBusinessDays.maximum} virkedager etter mottak og kontroll. Ved gyldig reklamasjon dekker Utekos nødvendig returfrakt.`
