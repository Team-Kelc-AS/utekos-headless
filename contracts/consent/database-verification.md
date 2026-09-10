# Lokal databasekontroll

Status 10. september 2026: **første kjøring stoppet i lokal bygging;
byggfeilen er rettet og særskilt verifisert; databasetest venter**.
Ingen produksjonsmigrering eller publisering er godkjent i denne runden.

Første kjøring, `job-mtuvpbx7-8e701e38`, avsluttet med kode 2 før
databasen eller migreringen startet. `pg_cron` manglet koblingen til
`libintl_ngettext` på macOS. Testoppsettet bruker nå `PG_LDFLAGS=-lintl`,
samme løsning som den offisielle Homebrew-formelen. En avgrenset ny
lenking av den identiske kilden bestod med kode 0. Det beviser byggrettingen,
ikke at migreringen eller databasetestene har bestått.

## Avgrensning

Brukerens godkjenning gjelder en ny, isolert lokal database med kun
syntetiske rader. Testen starter en egen PostgreSQL 17-klynge i en privat
midlertidig mappe, uten TCP-lytting. Den bruker ikke `.env.local`, eksterne
databaseadresser, eksisterende databaseklynger, Docker eller Podman.
Klyngen stoppes etter testen. Syntetisk database og testbevis beholdes lokalt.

Testens SQL-kilde er den uendrede migreringen
`20260910060000_add_operational_v1_privacy_policy.sql`. Avhengighetene er
utvalgte, ordrette DDL-blokker fra de eksisterende landing- og
retensjonsmigreringene; dette er **ikke** en full gjenspilling av hele
Supabase-prosjektet. Kildehash registreres i resultatet.

Lesing av Supabases systemkatalog 10. september bekreftet:

- `postgres` og `service_role` har BYPASSRLS, men er ikke superbrukere;
- `anon` og `authenticated` har verken BYPASSRLS eller superbrukertilgang;
- ingen globale eller `ops`-spesifikke standardrettigheter for objekter
  opprettet av `postgres` ble returnert; standardrettighetene som ble
  returnert gjaldt `public`;
- SQL-utvidelsesversjonen for `pg_cron` er `1.6.4`.

Kontrollen leste bare roller, standardrettigheter og utvidelsesversjoner,
ikke kundedata. Ingen produksjonsendring ble gjort. Testen gjenskaper de
relevante rollene lokalt og utfører migreringen som ikke-superbrukeren
`postgres`. Lokal testadministrator brukes bare til oppsett og kontroll.

Ekte `pg_cron` bygges fra offisiell `v1.6.8`, commit
`5cedfa472ccc83567aa23ec645925ed8489a7797`, mot allerede installert
PostgreSQL 17.11. Kun denne lokale utvidelsen installeres dersom den ikke
allerede finnes; ingen databaseoppgradering eller bakgrunnstjeneste
installeres. SQL-utvidelsen opprettes med versjon `1.6.4`. Lik SQL-versjon
beviser ikke identisk binærversjon med leverandørens drift.

## Krav og observerbar test

| Krav | Testbevis |
| --- | --- |
| Privat og eksplisitt godkjent aggregering | Avslått start, avvist selvaktivering fra service role, RLS og negative privilegietester |
| Ingen annonse-/nettleserprofil i nye driftsrader | Hvert forbudte felt testes separat mot databasens constraint |
| Ingen tilbakesending ved ny godkjenning | Deaktivert og manglende kontroll gir ingen aggregat; ny aktivering teller kun ny rad |
| Korrekte trafikktall | Duplikater, samtidige forbindelser, avbrutt batch, byte og ulike loggkilder |
| Kalenderdøgn og tidsgrunnlag | Norsk datogrense og framtidig observasjon med eldre mottakstid |
| Oppbevaring | Syv dager med timemargin, 90 kalenderdager, aktive og utløpte oppbevaringsunntak |
| Gamle data videreføres | Legacy-rad overlever migrering; eksisterende 30-dagers ryddefunksjon testes separat |
| Sikker migrering | Transaksjon avbrytes etter DDL og skal rulle alt tilbake; gjentatt migrering skal feile uten delendring |
| Faktisk jobbplanlegging | Riktige jobbeiere/tider, navnebasert upsert, ekte kort testjobb og kjøringskvittering |
| Funksjonskontroll | Ekte plpgsql_check for trigger og ryddefunksjon, samt Supabase CLI lint |
| Varighet over omstart | Samme skjema, avslått kontroll og navngitte jobber etter lokal PostgreSQL-omstart |

Den korte testjobben kjører samme ryddefunksjon som produksjonsplanen, men
på syntetiske lokale data. Testjobben fjernes etterpå og lokal
jobbkjøring deaktiveres. Den ordinære timeplanen endres ikke i migreringen.

## Kjøring og grenser

`scripts/consent/run-operational-database-smoke.sh` etablerer miljøet,
kjører testen, lint, typesjekk og omstartskontroll. Jobben kan ta mer enn
ett minutt og kjøres gjennom Codex Process Jobs. Hvert trinn får egen logg
i en ny ignorert `work/consent-database.*`-mappe.

Et lokalt grønt resultat dekker ikke PostgREST/JWT, hele Supabase-stacken,
fjern migrasjonshistorikk, produksjonsmigrering, Vercel-loggdrain,
Cookiebot/GTM eller faktisk annonselevering. Disse portene er fortsatt
separate.

## Dokumentasjonsgrunnlag

Gjeldende dokumentasjon ble hentet via Supabase MCP og Context7:

- [Supabase database testing](https://supabase.com/docs/guides/local-development/testing/overview)
- [PostgreSQL 17 initdb](https://www.postgresql.org/docs/17/app-initdb.html)
- [PostgreSQL 17 connection settings](https://www.postgresql.org/docs/17/runtime-config-connection.html)
- [pg_cron v1.6.8](https://github.com/citusdata/pg_cron/blob/v1.6.8/README.md)
- [Postgres.js](https://github.com/porsager/postgres)
- [Homebrews pg_cron-formel](https://github.com/Homebrew/homebrew-core/blob/master/Formula/p/pg_cron.rb)

Utvidelsens konkrete Makefile, kontrollfil og tag-commit ble også lest
direkte fra det offisielle kildearkivet før testoppsettet ble skrevet.
