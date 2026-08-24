# Cookiebot CMP

| Felt              | Verdi                                  |
| -------------------| ----------------------------------------|
| Tag-navn          | Cookiebot CMP                          |
| TagID             | 126                                    |
| Tagtype           | Cookiebot CMP                          |
| Leverandør        | Usercentrics                           |
| Kilde             | Galleri                                |
| Cookiebot ID      | `f2145160-1ac5-4859-8385-36dc6327495f` |
| Language          | Default (auto-detect)                  |
| CDN Region        | `.eu`                                  |
| Add Geo Region(s) | –                                      |

## Consent Mode-innstillinger

| Innstilling | Status |
| --- | --- |
| Enable Google Consent Mode | På |
| Enable IAB Transparency and Consent Framework | Av |
| Enable URL passthrough | På |
| Advertiser Consent Mode | På |

| Felt | Verdi |
| --- | --- |
| Wait for update | `500` ms |
| Redact ads data | Dynamic (match `ad_storage`) |

### Default Consent State

Region tom = gjelder globalt. Ingen radverdier var fylt inn i dumpen.

| Region | Preferences (`functionality_storage` og `personalization_storage`) | Statistics (`analytics_storage`) | Marketing (`ad_storage`) | Marketing (`ad_user_data`) | Marketing (`ad_personalization`) | Handling |
| --- | --- | --- | --- | --- | --- | --- |
| – | – | – | – | – | – | – |

## Tagtillatelser

Setter inn skript på siden.

| Tillatt URL-mønster |
| --- |
| `https://*.cookiebot.com/` |
| `https://*.cookiebot.eu/` |

Får tilgang til den globale samtykketilstanden.

| Samtykketype | Lesetillatelse | Skrivetillatelse |
| --- | --- | --- |
| `analytics_storage` | false | true |
| `ad_storage` | false | true |
| `functionality_storage` | false | true |
| `personalization_storage` | false | true |
| `security_storage` | false | true |
| `wait_for_update` | false | true |
| `ad_personalization` | false | true |
| `ad_user_data` | false | true |

Leser verdier i informasjonskapsler. Tilgang: spesifikk.

| Tillatt informasjonskapsel |
| --- |
| `CookieConsent` |

Skriver til datalaget.

| Datalag-nøkkel |
| --- |
| `ads_data_redaction` |
| `url_passthrough` |
| `developer_id.dMWZhNz` |

## Avanserte innstillinger

| Felt | Verdi |
| --- | --- |
| Prioritering for utløsing av taggen | – |
| Aktiver en egendefinert tidsplan for utløsing av taggen | Av |
| Bare utløs denne taggen i publiserte beholdere | Av |
| Alternativer for utløsing av tagger | Én gang per side |

## Sekvensering av tagger

| Felt | Verdi |
| --- | --- |
| Utløs en tag før **Cookiebot CMP** | – |
| Utløs en tag etter at **Cookiebot CMP** utløses | – |

## Ekstra metadata om taggen

| Nøkkel | Verdi |
| --- | --- |
| Ta med navnet på taggen | – |
| Metadata-rader | – |

## Innstillinger for samtykke (beta)

| Felt | Verdi |
| --- | --- |
| Innebygde samtykkekontroller | `analytics_storage`, `ad_storage`, `functionality_storage`, `personalization_storage`, `security_storage`, `wait_for_update`, `ad_personalization`, `ad_user_data` |
| Ekstra samtykkekontroller | Ikke angitt |
| Ekstra samtykke kreves ikke | Ja |
| Krev ekstra samtykke for at taggen skal utløses | Av |

## Valg av utløsere

| Felt | Verdi |
| --- | --- |
| Utløsere | Consent Initialization - All Pages |
| Utløsertype | Consent Initialization |
