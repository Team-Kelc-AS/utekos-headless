# Meta Dataset Quality snapshot remediation — 2026-07-26

## Status

Teknisk implementasjon, kontrollerte dataoperasjoner, Preview og
produksjonspromotering er fullført. Snapshotet er fortsatt korrekt gult fordi
`Lead` ikke finnes i dagens Meta Dataset Quality-data. Én operatørstyrt
newsletter-Lead, read-only verifisering av Sentry-monitorene og observasjon av
neste planlagte primary/retry er åpne sluttgater.

## Startbevis

- Snapshotdag: `2026-07-26` UTC.
- Primary: `03:17:25` UTC, HTTP 200.
- Retry: `04:17:08` UTC, HTTP 200.
- Måletid: `03:17:28.955` UTC.
- Snapshot: 7 rader; `PageView`, `ViewContent`, `AddToCart`,
  `InitiateCheckout` og `Purchase` finnes, `Lead` mangler.
- Ekstra eventer: `AddToWishlist` og `SelectItem`.
- Duplikater: 0 per dataset/event/UTC-dag.
- Feilklasse: provider/data availability, ikke cron, auth eller database.

## Google-opprydding

Read-only opptelling fant 144 uløste Google dead letters. Den daværende
planleggeren brukte dead-letterens `created_at` og klassifiserte 10 som innenfor
den absolutte 72-timersgrensen. I én transaksjon ble 134 rader lukket som
`outside_provider_replay_window`, mens 10 ble re-køet med opprinnelig event-ID,
idempotens og kanonisk payload bevart. Payloaden ble bygget med korrigert mapper
uten ugyldig `subdivision_code`.

Provider-outbox ble kjørt nøyaktig én gang. Google avviste alle 10 før
request-ID med `INVALID_ARGUMENT` på `events.events[0].event_timestamp`:
hendelsene var omtrent 61 timer gamle og utenfor det effektive vinduet for den
aktive additional-source-flyten. Ingen ny resend ble gjort. De 10 nye
dead-letter-auditradene ble lukket som `outside_provider_replay_window` med
feilbevis og payload bevart.

Varig kodeutbedring:

- SQL henter `provider_dispatch_attempts.payload` som `attempt_payload`.
- Google-freshness bruker kun `attempt_payload.event_time`.
- Manglende eller ugyldig kanonisk event-tid feiler lukket.
- Google-replay stoppes etter 48 timer; Meta- og Microsoft-vinduene er uendret.

Fersk read-only Supabase-status etter produksjonsdeploy:

| Gate | Status |
| --- | ---: |
| Uløste dead letters, alle providers | 0 |
| Uløste Google dead letters | 0 |
| Google `accepted_unverified/provider_status_timeout` | 25 |
| Av disse med faktisk senstatus `PROCESSING` | 25 |

De 25 `PROCESSING`-radene er ikke terminale, ikke markert levert og ikke sendt
på nytt.

## Snapshot- og Sentry-kontrakt

- Påkrevde eventer er eksakt `PageView`, `ViewContent`, `AddToCart`,
  `InitiateCheckout`, `Purchase` og `Lead`.
- Sync og cronrespons eksponerer `complete`, `missingRequiredEvents` og
  `runKind`; `ok`/HTTP uttrykker fortsatt kun teknisk kjørestatus.
- Sentry-monitorene er separate:
  `utekos-meta-dataset-quality-primary` (`17 3 * * *` UTC) og
  `utekos-meta-dataset-quality-retry` (`17 4 * * *` UTC).
- Autorisasjons- og runtimefeil avslutter check-in som `error`; en teknisk
  vellykket, ufullstendig sync avslutter som `ok`.
- Bare ufullstendig retry sender `meta_dataset_quality.incomplete` på WARN.
  Payloaden valideres uten PII, og fingerprint er event + dataset + UTC-dag.
- Den sentrale app-loggeren leverer WARN/ERROR én gang. Sentry-feil fanges og
  kan ikke endre cron-, newsletter- eller Lead-resultatet.

Sentry-kildemaps ble lastet opp under Vercel Preview-build. Den lokale
read-only tokenen returnerer 200 for project- og event-endepunktene, men fortsatt
403 for organisasjonsendepunktet. Den eksplisitte `org:read`-gaten er derfor
åpen, og monitor/check-in-status skal ikke kalles live-verifisert ennå.

## Verifikasjon og release

- Berørte tester: 46/46 grønne på den integrerte kandidaten.
- `npm run mcp:build`: fullført; to valgfrie token-placeholders varslet.
- `npm run mcp:doctor`: `OK` med seks eksplisitte valgfrie
  credential-/tokenvarsler.
- `pnpm exec next typegen`: grønn.
- `pnpm exec tsc --noEmit`: grønn.
- `pnpm build`: grønn, 126 statiske sider generert.
- `npm run tracking:gateway:smoke` mot `https://utekos.no`: GTM 200; sGTM 200,
  `Cache-Control: no-store`, `x-vercel-cache: MISS`.
- Preview: `dpl_FqTRYaheisTDVPcQQ7HxEs769Add`, `READY`, Git-SHA
  `3f4c2ec92b69c4f9cb612d2f6bf3023cf3c3c0e6`.
- Produksjon: Preview-artifact promotert uten rebuild til
  `dpl_4gVppqcSq863LoPtNMSmZZoUUhYB`, `READY`, samme Git-SHA, aliaser
  `utekos.no`, `www.utekos.no` og `feed.utekos.no`.
- Vercel runtime: ingen grupperte feil eller error/fatal-logger etter deploy.
- Registrerte crons: Google status hvert femte minutt, Meta primary 03:17 UTC,
  Meta retry 04:17 UTC og provider-outbox hvert femte minutt.

Preview-rutene ble verifisert uten cronsecret: primary returnerte HTTP 401 med
`runKind: primary`, retry returnerte HTTP 401 med `runKind: retry`. Ingen Meta-
cron ble kjørt manuelt.

## Åpne sluttgater

1. Operatøren sender én newsletter-Lead med Marketing-consent og en godkjent
   intern testinnboks. E-postadressen skal ikke legges i dette notatet eller i
   logger.
2. Samme redigerte event-ID skal bevises gjennom dataLayer, Supabase
   ledger/outbox, Meta Pixel/CAPI og Google Data Manager. Google må være
   terminal `SUCCESS`, `recordCount=1`, uten warning/error-grupper.
3. Lokal Sentry-token må få `org:read`; monitor/check-in og den dedupliserte
   WARN-flaten verifiseres deretter read-only.
4. Neste planlagte Meta primary/retry observeres; rutene kjøres ikke manuelt.
5. Meta Dataset Quality må faktisk vise `Lead`. Ingen syntetisk snapshotrad
   opprettes.
6. Dag-14-vurderingen 2026-08-02 gjennomføres før langsiktig trendkonklusjon.

## Mutasjonsgrense

Én kontrollert Google-replay/opprydding, Supabase-auditoppdatering og Vercel
produksjonspromotering ble utført under eksplisitt godkjenning. Ingen GTM-
publisering, Meta-cronkjøring, Shopify-kunderedigering eller syntetisk
snapshotrad ble utført.

Dokumentasjonsstatus: Tilstrekkelig og oppdatert dokumentasjon og runtime-
kontekst forelå for implementasjon og deploy. Full sluttverifisering er fortsatt
blokkert av operatør-Lead, Sentry `org:read` og neste planlagte snapshotkjøring.
