import React from 'react'
import type { Section } from '@types'
import { CookieDeclaration } from '@/components/legal/CookieDeclaration'

function PolicyItem({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <li>
      <span className='block font-utekos-text-medium text-white'>{title}</span>
      <span className='block text-white/90'>{children}</span>
    </li>
  )
}

function ExternalLink({
  href,
  children
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a href={href} target='_blank' rel='noopener noreferrer'>
      {children}
    </a>
  )
}

export const lastUpdated = '26. juli 2026'
export const lastUpdatedIso = '2026-07-26'

export function createPrivacySections({
  includeCookieDeclaration = true
}: {
  includeCookieDeclaration?: boolean
} = {}): Section[] {
  return [
  {
    id: 'ansvarlig',
    title: 'Hvem som er ansvarlig',
    content: (
      <>
        <p>
          KELC AS, organisasjonsnummer 925 820 393, er behandlingsansvarlig for
          personopplysninger som Utekos behandler om besøkende og kunder, med
          unntak av behandling der en leverandør er selvstendig
          behandlingsansvarlig. Utekos er merkenavnet vi bruker utad.
        </p>
        <ul className='space-y-4'>
          <PolicyItem title='Adresse'>
            Lille Damsgårdsveien 25, 5162 Laksevåg, Norge
          </PolicyItem>
          <PolicyItem title='E-post'>
            <a href='mailto:kundeservice@utekos.no'>kundeservice@utekos.no</a>
          </PolicyItem>
        </ul>
        <p>
          Erklæringen gjelder utekos.no, nettbutikken, utsjekk på
          kasse.utekos.no, kundekonto, kundeservice, venteliste, nyhetsbrev og
          tilknyttet analyse og annonseringsmåling.
        </p>
      </>
    )
  },
  {
    id: 'opplysninger',
    title: 'Opplysninger vi behandler',
    content: (
      <>
        <p>Avhengig av hvordan du bruker Utekos, kan vi behandle:</p>
        <ul className='space-y-4'>
          <PolicyItem title='Kontakt- og kundeopplysninger'>
            Navn, e-post, telefonnummer, faktura- og leveringsadresse, land og
            opplysninger du selv skriver i en henvendelse.
          </PolicyItem>
          <PolicyItem title='Kjøp og betaling'>
            Ordre, varer, beløp, leveringsvalg, retur, refusjon,
            transaksjonsstatus og nødvendige regnskapsopplysninger. KELC AS
            mottar normalt ikke fullstendige kortopplysninger; de behandles av
            Shopify, Klarna eller annen valgt betalingsleverandør.
          </PolicyItem>
          <PolicyItem title='Konto, venteliste og nyhetsbrev'>
            Kontoinformasjon, ønsket produkt, kontaktkanal,
            markedsføringsstatus og dokumentasjon på påmelding eller avmelding.
          </PolicyItem>
          <PolicyItem title='Enhet, bruk og attribusjon'>
            IP-adresse, nettleser og enhet, side og tidspunkt, samtykkestatus,
            handlekurv- og checkout-identifikatorer og annonseklikk-ID-er når
            samtykket tillater det.
          </PolicyItem>
          <PolicyItem title='Pseudonymiserte identifikatorer'>
            E-post eller telefon kan normaliseres og hashes før godkjent
            annonseringsmåling. Hashing gjør opplysningen pseudonymisert, ikke
            anonym; den behandles fortsatt som en personopplysning.
          </PolicyItem>
          <PolicyItem title='Historiske kunde- og målgruppeopplysninger'>
            Eldre kundedatasett kan inneholde navn, kontaktdata, fødselsdato
            eller fødselsår, alder, kjønn, postnummer, sted og samlet
            kundeverdi. Slike opplysninger skal ikke eksporteres til en
            annonsemålgruppe uten dokumentert behandlingsgrunnlag og gyldig
            markedsføringsstatus.
          </PolicyItem>
          <PolicyItem title='Teknisk sikkerhet'>
            Begrensede hendelseskoder, statuskoder, tidspunkt og redigert
            rutekontekst. Applogger skal ikke inneholde navn, kontaktdata,
            ordrenummer, fritekst, full URL, query-parametere eller rå svar fra
            leverandører.
          </PolicyItem>
        </ul>
        <p>
          Vi mottar opplysningene fra deg, nettleseren eller enheten din,
          Shopify og betalings-/leveringsaktører, og fra analyse- og
          annonseleverandører når du har gitt nødvendig samtykke.
        </p>
      </>
    )
  },
  {
    id: 'formal-grunnlag',
    title: 'Formål, behandlingsgrunnlag og nødvendighet',
    content: (
      <div className='not-prose overflow-x-auto'>
        <table className='w-full min-w-176 border-collapse text-left text-sm leading-6'>
          <thead>
            <tr className='border-b border-white/30'>
              <th scope='col' className='p-3'>Formål</th>
              <th scope='col' className='p-3'>Grunnlag</th>
              <th scope='col' className='p-3'>Er opplysningene nødvendige?</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-white/15'>
            <tr>
              <td className='p-3'>Kjøp, betaling, levering, retur og konto</td>
              <td className='p-3'>GDPR art. 6 nr. 1 bokstav b (avtale)</td>
              <td className='p-3'>Ja, for å levere det du bestiller.</td>
            </tr>
            <tr>
              <td className='p-3'>Regnskap, avgift og lovpålagt dokumentasjon</td>
              <td className='p-3'>Art. 6 nr. 1 bokstav c (rettslig plikt)</td>
              <td className='p-3'>Ja, når loven krever oppbevaring.</td>
            </tr>
            <tr>
              <td className='p-3'>Kundeservice, garanti og tvister</td>
              <td className='p-3'>Art. 6 nr. 1 bokstav b og f</td>
              <td className='p-3'>Frivillig å kontakte oss, men vi trenger relevante opplysninger for å svare.</td>
            </tr>
            <tr>
              <td className='p-3'>Produktventeliste</td>
              <td className='p-3'>Art. 6 nr. 1 bokstav b og f</td>
              <td className='p-3'>Frivillig. Kontaktdata er nødvendig for varslingen og brukes ikke som generelt markedsføringssamtykke.</td>
            </tr>
            <tr>
              <td className='p-3'>Nyhetsbrev og direkte markedsføring</td>
              <td className='p-3'>Art. 6 nr. 1 bokstav a (samtykke) og markedsføringsloven</td>
              <td className='p-3'>Frivillig og kan trekkes tilbake når som helst.</td>
            </tr>
            <tr>
              <td className='p-3'>Sikkerhet, feilretting og misbruksforebygging</td>
              <td className='p-3'>Art. 6 nr. 1 bokstav f (berettiget interesse)</td>
              <td className='p-3'>Nødvendig for en sikker og stabil tjeneste; datamengden begrenses.</td>
            </tr>
            <tr>
              <td className='p-3'>Analyse, attribusjon, konverteringsmåling og annonsering</td>
              <td className='p-3'>Art. 6 nr. 1 bokstav a (samtykke)</td>
              <td className='p-3'>Frivillig. Avslag påvirker ikke muligheten til å handle.</td>
            </tr>
            <tr>
              <td className='p-3'>Dokumentere samtykke og personvernvalg</td>
              <td className='p-3'>Art. 6 nr. 1 bokstav c og f</td>
              <td className='p-3'>Nødvendig for å kunne etterleve og dokumentere valget.</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  },
  {
    id: 'leverandorer',
    title: 'Leverandører og mottakere',
    content: (
      <>
        <p>
          Vi deler bare opplysninger når det er nødvendig for formålet, når du
          har samtykket, eller når loven krever det. Viktige mottakere er:
        </p>
        <ul className='space-y-4'>
          <PolicyItem title='Vercel'>
            Hosting, nettverksbeskyttelse og tekniske logger. Web Analytics og
            Speed Insights er cookieløse og aggregerte tjenester, men Utekos
            aktiverer dem likevel først etter statistikksamtykke.
          </PolicyItem>
          <PolicyItem title='Shopify'>
            Nettbutikk, produkter, handlekurv, checkout, kundekonto og ordre.
            Shopify er normalt databehandler for butikkdriften, men kan være
            selvstendig behandlingsansvarlig for egne forbrukertjenester, som
            Shop og enkelte personaliserte funksjoner.
          </PolicyItem>
          <PolicyItem title='Klarna og andre betalingsaktører'>
            Betalingsbehandling, kredittvurdering der det er relevant,
            transaksjonsstatus og svindelforebygging. Betalingsaktøren har egen
            personvernerklæring og kan være selvstendig behandlingsansvarlig.
          </PolicyItem>
          <PolicyItem title='Supabase'>
            Database for nødvendige leads, samtykkebevis, attribusjon,
            behandlingsaudit og ordre-/analysegrunnlag. Den aktive databasen er
            plassert i EU-regionen Stockholm.
          </PolicyItem>
          <PolicyItem title='Resend'>
            Utsending av kundeservice- og ventelistevarsler fra regionen
            eu-west-1 (Irland). Åpnings- og klikksporing er deaktivert, og vi
            livssyklus-webhooks for forlatt kasse lagres kun som
            dataminimerte tekniske ID-er og status – ikke rå e-postadresse,
            emne eller meldingsinnhold. Resend opplyser at kontodata,
            e-postmetadata og logger kan lagres i USA.
          </PolicyItem>
          <PolicyItem title='Sentry'>
            Feilovervåking med dataminimerte hendelser. Innsending av
            standard-PII er deaktivert i klientkonfigurasjonen.
          </PolicyItem>
          <PolicyItem title='Cookiebot by Usercentrics'>
            Samtykkegrensesnitt, kategorivalg og dokumentasjon av valg.
          </PolicyItem>
          <PolicyItem title='Google, Meta og Microsoft'>
            Tagstyring, analyse, annonsemåling, attribusjon, målgrupper og
            annonsering i samsvar med valgt statistikk- og/eller
            markedsføringskategori. Google Tag Manager kan sende redigerte,
            cookieløse Consent Mode-signaler med standard avslag; øvrige
            ikke-nødvendige tagger er kategori-gatet.
          </PolicyItem>
          <PolicyItem title='YouTube'>
            Videoavspilling. Cookiebot klassifiserer den innebygde
            YouTube-tjenesten som markedsføring, og iframe og tilhørende
            lagring aktiveres derfor først med markedsføringssamtykke.
          </PolicyItem>
        </ul>
        <p>
          En tidligere planlagt kundeserviceflyt til et separat Atlas-prosjekt
          er deaktivert. Kontaktskjemaet sender ikke opplysninger dit før
          region, tilgang, datamodell og sletting er særskilt revidert.
        </p>
        <p>
          Tilgang til et eldre Meta-målgruppeuttrekk er tilsvarende satt
          fail-closed inntil koblingen til dokumentert markedsføringsgrunnlag er
          verifisert. Det påvirker ikke ordrebehandling eller kundeservice.
        </p>
        <p>
          Les mer hos{' '}
          <ExternalLink href='https://vercel.com/legal/privacy-policy'>Vercel</ExternalLink>,{' '}
          <ExternalLink href='https://privacy.shopify.com/en'>Shopify</ExternalLink>,{' '}
          <ExternalLink href='https://www.klarna.com/no/personvern/'>Klarna</ExternalLink>,{' '}
          <ExternalLink href='https://supabase.com/privacy'>Supabase</ExternalLink>,{' '}
          <ExternalLink href='https://resend.com/legal/privacy-policy'>Resend</ExternalLink>{' '}
          og <ExternalLink href='https://sentry.io/privacy/'>Sentry</ExternalLink>.
        </p>
      </>
    )
  },
  {
    id: 'cookies',
    title: 'Informasjonskapsler og samtykke',
    content: (
      <>
        <p>
          Informasjonskapsler er små tekstfiler som lagres på enheten din. Vi
          bruker Cookiebot som eneste samtykkegrensesnitt for nødvendige,
          preferanse-, statistikk- og markedsføringskategorier. Det skal være
          like enkelt å avslå som å godta ikke-nødvendig behandling.
        </p>
        <p>
          Nødvendige teknologier støtter blant annet sikkerhet, handlekurv,
          checkout og lagring av personvernvalget. Preferanser husker valgte
          innstillinger. Statistikk måler bruk og ytelse. Markedsføring måler
          annonser og kan knytte besøk til annonseplattformer. Du kan trekke
          tilbake eller endre et valg når som helst; videre innsamling i den
          aktuelle kategorien stoppes.
        </p>
        <p>
          Cookiebot synkroniserer valget med Shopify Customer Privacy API slik
          at checkout kan respektere samme valg. Vi viser ikke et ekstra
          Shopify-banner. Nettstedet svarer ikke særskilt på den eldre
          nettleserinnstillingen «Do Not Track», fordi den ikke har en entydig
          standard. Der leverandøren støtter Global Privacy Control, kan dette
          signalet bli håndtert av leverandørens personvernmekanisme.
        </p>
        <p>
          Listen nedenfor lastes direkte fra Cookiebots siste skann og viser
          navn, leverandør, formål, type og varighet. Den er derfor mer presis
          enn et hardkodet antall cookies. Du kan også slette eller blokkere
          cookies i nettleseren; nødvendige funksjoner som handlekurv og
          checkout kan da slutte å virke.
        </p>
        {includeCookieDeclaration ?
          <CookieDeclaration />
        : <p>
            Den dynamiske Cookiebot-erklæringen vises på{' '}
            <ExternalLink href='https://utekos.no/personvern#cookies'>
              utekos.no/personvern
            </ExternalLink>
            . Der finner du den til enhver tid oppdaterte listen og kan endre
            valgene dine.
          </p>
        }
      </>
    )
  },
  {
    id: 'lagring',
    title: 'Hvor lenge opplysningene lagres',
    content: (
      <>
        <p>
          Fristene nedenfor er maksimumsfrister. Vi sletter tidligere når
          formålet er oppfylt, med mindre lovlig dokumentert unntak gjelder.
        </p>
        <div className='not-prose overflow-x-auto'>
          <table className='w-full min-w-176 border-collapse text-left text-sm leading-6'>
            <thead>
              <tr className='border-b border-white/30'>
                <th scope='col' className='p-3'>Datakategori</th>
                <th scope='col' className='p-3'>Maksimal lagring</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-white/15'>
              <tr><td className='p-3'>Rå nettleser-, attribusjons-, checkout- og providerdata</td><td className='p-3'>14 måneder. Anonyme dagstall aggregeres før sletting.</td></tr>
              <tr><td className='p-3'>Uløste providerpayloads</td><td className='p-3'>Payload redigeres senest etter 90 dager; minimal statusaudit beholdes inntil 14 måneder.</td></tr>
              <tr><td className='p-3'>Samtykkebevis</td><td className='p-3'>3 år etter siste valg eller tilbaketrekking.</td></tr>
              <tr><td className='p-3'>Kundeservice</td><td className='p-3'>24 måneder etter avsluttet sak. Ordre-, garanti- og tvistesaker følger relevant rettslig frist.</td></tr>
              <tr><td className='p-3'>Venteliste</td><td className='p-3'>Maksimalt 12 måneder, eller sletting innen 30 dager etter varsling eller tilbaketrekking.</td></tr>
              <tr><td className='p-3'>Nyhetsbrev</td><td className='p-3'>Aktiv adresse til avmelding. Direkte identifikator i Supabase-speil maksimalt 14 måneder; minimalt samtykke-/avmeldingsbevis 3 år.</td></tr>
              <tr><td className='p-3'>Ordre og regnskap</td><td className='p-3'>Primærdokumentasjon 5 år etter regnskapsårets slutt; sekundærdokumentasjon 3,5 år.</td></tr>
              <tr><td className='p-3'>Rå Shopify GraphQL-svar og overflødige payloadkopier</td><td className='p-3'>30 dager etter at normaliserte ordredata er verifisert.</td></tr>
              <tr><td className='p-3'>Tekniske applogger</td><td className='p-3'>Maksimalt 30 dager og uten kundedata; ingen Redis-kopi.</td></tr>
              <tr><td className='p-3'>Fullt anonymiserte aggregater</td><td className='p-3'>Kan beholdes uten tidsgrense fordi de ikke lenger kan knyttes til en person.</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          Juridiske unntak, for eksempel en pågående tvist eller lovpålagt
          oppbevaring, skal ha dokumentert årsak og utløpsdato.
        </p>
      </>
    )
  },
  {
    id: 'overforinger',
    title: 'Behandling utenfor EØS',
    content: (
      <>
        <p>
          Vi påstår ikke at all behandling skjer i EØS. Enkelte leverandører
          eller deres underleverandører behandler opplysninger i USA eller andre
          land. Når opplysninger overføres ut av EØS, skal overføringen bygge på
          en gyldig mekanisme, som en tilstrekkelighetsbeslutning, EU–US Data
          Privacy Framework for sertifiserte mottakere eller EU-kommisjonens
          standard personvernbestemmelser med nødvendige tilleggstiltak.
        </p>
        <p>
          Du kan kontakte oss for informasjon om mekanismen som gjelder for en
          bestemt leverandør eller overføring.
        </p>
      </>
    )
  },
  {
    id: 'rettigheter',
    title: 'Dine rettigheter og valg',
    content: (
      <>
        <p>
          Du kan be om innsyn, retting, sletting, begrensning og dataportabilitet,
          og protestere mot behandling som bygger på berettiget interesse. Når
          behandlingen bygger på samtykke, kan du trekke det tilbake uten at det
          påvirker lovligheten av behandlingen før tilbaketrekkingen.
        </p>
        <ul className='space-y-4'>
          <PolicyItem title='Cookies og annonsering'>
            Bruk «Endre cookie-innstillinger» i cookie-delen eller lenken i
            bunnteksten.
          </PolicyItem>
          <PolicyItem title='Nyhetsbrev'>
            Bruk avmeldingslenken i e-posten eller kontakt oss.
          </PolicyItem>
          <PolicyItem title='Andre forespørsler'>
            Skriv til kundeservice@utekos.no. Vi kan be om rimelig
            identitetsbekreftelse og svarer innen lovpålagt frist.
          </PolicyItem>
        </ul>
        <p>
          Du kan klage direkte til{' '}
          <ExternalLink href='https://www.datatilsynet.no/om-datatilsynet/kontakt-oss/klage-til-datatilsynet/'>
            Datatilsynet
          </ExternalLink>
          . Vi ønsker gjerne muligheten til å rette opp først, men du trenger
          ikke kontakte oss før du klager.
        </p>
      </>
    )
  },
  {
    id: 'profilering-barn',
    title: 'Profilering, automatiserte avgjørelser og barn',
    content: (
      <>
        <p>
          Med markedsføringssamtykke kan analyse- og annonseleverandører bruke
          hendelser og pseudonymiserte identifikatorer til attribusjon,
          målgrupper og personalisering av annonser. Utekos bruker ikke
          automatiserte avgjørelser som har rettsvirkning eller tilsvarende
          vesentlig virkning for deg.
        </p>
        <p>
          Nettbutikken er laget for voksne kjøpere og er ikke rettet mot barn.
          Vi samler ikke bevisst inn personopplysninger direkte fra barn. En
          foresatt som mener at et barn har gitt oss opplysninger, kan kontakte
          oss for vurdering og sletting.
        </p>
      </>
    )
  },
  {
    id: 'sikkerhet',
    title: 'Sikkerhet og dataminimering',
    content: (
      <>
        <p>
          Vi bruker tilgangsstyring, kryptert transport, validering av eksterne
          data, dataminimering, leverandøravtaler og slettingsrutiner. Offentlige
          endepunkter skal ikke gi innsyn i interne logger. Ingen løsning er
          helt risikofri, så du bør ikke sende betalingskort, passord eller
          andre særlige kategorier personopplysninger i fritekst til
          kundeservice.
        </p>
      </>
    )
  },
  {
    id: 'endringer',
    title: 'Endringer i erklæringen',
    content: (
      <p>
        Vi oppdaterer erklæringen når behandlingen eller rettsgrunnlaget endres.
        Datoen øverst viser siste versjon. Vesentlige endringer varsles på en
        tydelig måte når regelverket krever det.
      </p>
    )
  },
  {
    id: 'kontakt',
    title: 'Kontakt oss',
    content: (
      <>
        <p>
          Spørsmål om personvern eller en forespørsel om rettigheter kan sendes
          til <a href='mailto:kundeservice@utekos.no'>kundeservice@utekos.no</a>
          . Oppgi bare informasjonen vi trenger for å finne og behandle
          forespørselen.
        </p>
        <p>
          KELC AS, org.nr. 925 820 393<br />
          Lille Damsgårdsveien 25<br />
          5162 Laksevåg, Norge
        </p>
      </>
    )
  }
  ]
}

export const privacySections = createPrivacySections()
