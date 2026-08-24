# Canonical page view

| Felt | Verdi |
| --- | --- |
| Tag-navn | Canonical page view |
| TagID | 148 |
| Tagtype | Google Analytics: GA4-hendelse |
| Leverandør | Google Analytics |
| Målings-ID | `{{GA4 Measurement ID}}` |
| Google-tag i beholderen | Denne taggen bruker konfigurasjonen for Google-taggen **Google Analytics Master**. |
| Navn på hendelsen | `page_view` |

## Hendelsesparametere

| Hendelsesparameter | Verdi |
| --- | --- |
| `event_id` | `{{DLV - event_id}}` |
| `event_time` | `{{DLV - event_time}}` |
| `page_view_id` | `{{DLV - page_view_id}}` |
| `page_location` | `{{DLV - page_location}}` |
| `page_referrer` | `{{DLV - page_referrer}}` |
| `page_title` | `{{DLV - page_title}}` |
| `event_source` | `{{DLV - source}}` |

## Netthandel

| Felt | Verdi |
| --- | --- |
| Send netthandelsdata | På |
| Datakilde | Data Layer |

## Innstillinger for samtykke (beta)

| Felt | Verdi |
| --- | --- |
| Innebygde samtykkekontroller | `ad_storage`, `ad_personalization`, `ad_user_data`, `analytics_storage` |
| Ekstra samtykkekontroller | – |
| Krev ekstra samtykke for at taggen skal utløses | På |

| Pålagt samtykketype | Status |
| ---------------------| --------|
| `analytics_storage` | På     |

## Valg av utløsere

| Felt        | Verdi                     |
| -------------| ---------------------------|
| Utløsere    | Canonical GA4 – page_view |
| Utløsertype | Egendefinert hendelse     |

## Merknader

Canonical `page_view`-adapter. Applikasjonen slipper den holdte hendelsen etter samtykke med original `event_id`. Én eksakt kanonisk utløser eier GA4-leveransen.


## Valg av utløsere

| Felt        | Verdi                     |
| -------------| ---------------------------|
| Utløsere    | Canonical GA4 – page_view |
| Utløsertype | Egendefinert hendelse     |

Canonical GA4 – page_view
- Egendefinert hendelse
