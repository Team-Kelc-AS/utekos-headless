# Microsoft UET – Canonical business events

| Felt | Verdi |
| --- | --- |
| Tag-navn | Microsoft UET – Canonical business events |
| TagID | 131 |
| Tagtype | Sporing av universelle Microsoft Advertising-hendelser |
| Leverandør | Microsoft Advertising |
| Track type | Define your own |
| Define your own event action | `{{Event}}` |

## Hendelsesparametere

Verdier i tabellen under kan overstyre eksplisitte felt over.

| Name | Value |
| --- | --- |
| `event_category` | `{{Event}}` |
| `event_label` | `{{DLV - event_id}}` |
| `event_value` | `{{DLV - commerce.value}}` |
| `revenue_value` | `{{DLV - commerce.value}}` |
| `currency` | `{{DLV - commerce.currency}}` |
| `event_id` | `{{DLV - event_id}}` |
| `ecomm_pagetype` | `{{Microsoft UET - page type}}` |
| `ecomm_totalvalue` | `{{DLV - commerce.value}}` |
| `ecomm_prodid` | `{{Microsoft UET - product IDs}}` |

Én **UET config / page view**-tag er påkrevd på hver side. Tag-ID (og øvrig config) må settes på config-taggen, og den må utløses på hver side. Andre UET-hendelser fyrer ikke uten at den taggen har kjørt.

## Innstillinger for samtykke (beta)

| Felt | Verdi |
| --- | --- |
| Innebygde samtykkekontroller | `ad_storage`, `ad_personalization`, `ad_user_data` |
| Ekstra samtykkekontroller | – |
| Krev ekstra samtykke for at taggen skal utløses | På |

| Pålagt samtykketype | Status |
| --- | --- |
| `ad_storage` | På |
| `ad_user_data` | På |
| `ad_personalization` | På |

## Valg av utløsere

| Felt | Verdi |
| --- | --- |
| Utløsere | Canonical Microsoft business events |
| Utløsertype | Egendefinert hendelse |

## Merknader

Offisiell native Microsoft UET business-adapter. Canonical event action, `event_id`-deduplisering, value/currency og dynamiske remarketing-parametere.
