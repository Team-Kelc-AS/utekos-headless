# Microsoft Clarity - Official

| Felt | Verdi |
| --- | --- |
| Tag-navn | Microsoft Clarity - Official |
| TagID | 127 |
| Tagtype | Microsoft Clarity - Official |
| Leverandør | Microsoft |
| Kilde | Galleri |
| Clarity Project Id | `wupwleuv2e` |

## Avanserte innstillinger

| Felt | Verdi |
| --- | --- |
| Alternativer for utløsing av tagger | Én gang per side |

## Innstillinger for samtykke (beta)

| Felt | Verdi |
| --- | --- |
| Ekstra samtykkekontroller | – |
| Krev ekstra samtykke for at taggen skal utløses | På |

| Pålagt samtykketype | Status |
| --- | --- |
| `analytics_storage` | På |

## Valg av utløsere

| Felt | Verdi |
| --- | --- |
| Utløsere | All Pages **eller** Consent updated – re-evaluate page tags |
| All Pages | Sidevisning |
| Consent updated – re-evaluate page tags | Egendefinert hendelse |

## Merknader

Lastes maksimalt én gang per side. **All Pages** håndterer lagret samtykke; `cookie_consent_update` håndterer første-side-grant.

## Tagtillatelser

Setter inn skript på siden.

| Tillatt URL-mønster        |
| ----------------------------|
| `https://www.clarity.ms/*` |

Får tilgang til globale variabler (muligens også sensitive API-er).

| Nøkkel | Les | Skriv | Kjør |
| --- | --- | --- | --- |
| `clarity` | true | true | true |
| `clarity.q` | true | true | true |

Leser metadata om hendelser i tilbakekalte hendelser. Ingenting som kan begrenses.

Leser data fra datalaget. Tilgang: spesifikk.

| Tillatt datalag-nøkkel |
| --- |
| `event` |
