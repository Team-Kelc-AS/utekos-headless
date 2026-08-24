# Kopi av Base Tag (UET 97247724)

| Felt | Verdi |
| --- | --- |
| Tag-navn | Kopi av Base Tag(UET 97247724) |
| TagID | 130 |
| Tagtype | Sporing av universelle Microsoft Advertising-hendelser |
| Leverandør | Microsoft Advertising |

## Tag-konfigurasjon

| Felt | Verdi |
| --- | --- |
| Microsoft Advertising UET Tag ID | `97247724` |
| UETQ variable ID | `uetq` |
| Track type | UET config / page view (required) |
| Send enhanced conversion values | Av (felt synlig, ikke satt som sporingsmodus) |
| Event action | Custom (input action name manually) |
| Define your own event action | – |
| Page path | – |
| Page title | – |
| Email Address | – |
| Phone Number | – |
| Event category | – |
| Event label | – |
| Event value | – |
| Currency | `USD` |
| Revenue value | – |

## Ecommerce-parametere

| Felt | Verdi |
| --- | --- |
| Retail product ID (`prodid`) | – |
| Retail page type (`pagetype`) | – |
| Retail total value | – |
| Retail category | – |
| Items-array (per-item) | – |

`prodid` må sendes som array hvis flere verdier brukes, ikke som kommaseparert streng. `pagetype` er påkrevd når `prodid` er satt.

## Hotel-parametere

| Felt | Verdi |
| --- | --- |
| Hotel base price | – |
| Hotel booking reference # | – |
| Hotel check-in date | – |
| Hotel check-out date | – |
| Hotel length of stay | – |
| Partner hotel ID | – |
| Hotel total price | – |
| Hotel page type | – |

`hct_total_price` og valuta er påkrevd når andre hotellparametere sendes.

## Travel-parametere

| Felt | Verdi |
| --- | --- |
| Travel destination ID | – |
| Travel origin ID | – |
| Travel page type | – |
| Travel start date | – |
| Travel end date | – |
| Travel total value | – |

## Egne hendelsesparametere

Verdier i tabellen under overstyrer eksplisitte felt over.

| Name | Value | Handling |
| --- | --- | --- |
| – | – | – |

## Tag settings

| Innstilling | Status |
| --- | --- |
| Enable navigation timing metrics | Av |
| Enable automatic tracking for page view events | Av |
| Enable cookies | På |
| Remove query string | Av |
| Disable auto page view | Av |

Verdier i tabellen under kan overstyre config-feltene over.

| Name | Value | Handling |
| --- | --- | --- |
| `gtmTagSource` | `1` | Endre / Slett |

## Consent settings (experimental)

| Innstilling | Status |
| --- | --- |
| Enable consent updates from GTM | På |
| Inherit initial consent from GTM | Av |

UET consent mode: [Microsoft Advertising-hjelp](https://help.ads.microsoft.com/apex/index/3/en/60119)

Én **UET config / page view**-tag er påkrevd på hver side. Tag-ID (og øvrig config) må settes på denne config-taggen, og den må utløses på hver side. Andre UET-hendelser fyrer ikke uten at denne taggen har kjørt.

## Avanserte innstillinger

| Felt | Verdi |
| --- | --- |
| Prioritering for utløsing av taggen | – |
| Aktiver en egendefinert tidsplan for utløsing av taggen | Av |
| Bare utløs denne taggen i publiserte beholdere | Av |
| Alternativer for utløsing av tagger | Én gang per side |

## Sekvensering av tagger

| Felt                                                                                           | Verdi                               |
| ------------------------------------------------------------------------------------------------| -------------------------------------|
| Utløs en tag før **Kopi av Base Tag(UET 97247724)**                                            | Konfigurasjonstag: ikke valgt       |
| Ikke utløs **Kopi av Base Tag(UET 97247724)** hvis forrige tag mislykkes eller settes på pause | `Undefined parameter - previousTag` |
| Utløs en tag etter at **Kopi av Base Tag(UET 97247724)** utløses                               | Oppryddingstag: ikke valgt          |
| Ikke utløs neste tag hvis **Kopi av Base Tag(UET 97247724)** mislykkes eller settes på pause   | `Undefined parameter - nextTag`     |

## Ekstra metadata om taggen

| Nøkkel | Verdi |
| --- | --- |
| Ta med navnet på taggen | – |
| Metadata-rader | – |

## Innstillinger for samtykke (beta)

| Felt | Verdi |
| --- | --- |
| Innebygde samtykkekontroller | `ad_storage`, `ad_personalization`, `ad_user_data` |
| Ekstra samtykkekontroller | Ikke angitt |
| Ekstra samtykke kreves ikke | Ja (standardtekst vises) |
| Krev ekstra samtykke for at taggen skal utløses | På |

| Pålagt samtykketype | Status |
| --- | --- |
| `ad_storage` | På |
| `ad_user_data` | På |
| `ad_personalization` | På |
