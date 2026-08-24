# GA4 – Canonical non-commerce events

| Felt | Verdi |
| --- | --- |
| Tag-navn | GA4 – Canonical non-commerce events |
| TagID | 149 |
| Tagtype | Google Analytics: GA4-hendelse |
| Leverandør | Google Analytics |
| Målings-ID | `{{GA4 Measurement ID}}` |
| Google-tag i beholderen | Denne taggen bruker konfigurasjonen for Google-taggen **Google Analytics Master**. |
| Navn på hendelsen | `{{Event}}` |

## Hendelsesparametere

| Felt | Verdi |
| --- | --- |
| Event Settings Variable | Ingen |

| Hendelsesparameter | Verdi |
| --- | --- |
| `event_id` | `{{DLV - event_id}}` |
| `event_time` | `{{DLV - event_time}}` |
| `page_view_id` | `{{DLV - page_view_id}}` |
| `page_location` | `{{DLV - page_location}}` |
| `page_referrer` | `{{DLV - page_referrer}}` |
| `page_title` | `{{DLV - page_title}}` |
| `event_source` | `{{DLV - source}}` |

## Brukeregenskaper

| Områdenavn | Verdi |
| --- | --- |
| – | – |

## Netthandel

| Felt | Verdi |
| --- | --- |
| Send netthandelsdata | Av |

## Avanserte innstillinger

| Felt | Verdi |
| --- | --- |
| Prioritering for utløsing av taggen | – |
| Aktiver en egendefinert tidsplan for utløsing av taggen | Av |
| Bare utløs denne taggen i publiserte beholdere | Av |
| Alternativer for utløsing av tagger | Én gang per hendelse |

## Sekvensering av tagger

| Felt | Verdi |
| --- | --- |
| Utløs en tag før **GA4 – Canonical non-commerce events** | – |
| Utløs en tag etter at **GA4 – Canonical non-commerce events** utløses | – |

## Ekstra metadata om taggen

| Nøkkel | Verdi |
| --- | --- |
| Ta med navnet på taggen | – |
| Metadata-rader | – |

## Innstillinger for samtykke (beta)

| Felt | Verdi |
| --- | --- |
| Innebygde samtykkekontroller | `ad_storage`, `ad_personalization`, `ad_user_data`, `analytics_storage` |
| Ekstra samtykkekontroller | Ikke angitt |
| Ekstra samtykke kreves ikke | Ja (standardtekst vises) |
| Krev ekstra samtykke for at taggen skal utløses | På |

| Pålagt samtykketype | Status |
| ---------------------| --------|
| `analytics_storage` | På     |

## Valg av utløsere

| Felt | Verdi |
| --- | --- |
| Utløsere | Canonical GA4 – non-commerce events |
| Utløsertype | Egendefinert hendelse |
