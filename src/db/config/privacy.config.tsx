import React from 'react'
import type { Section } from '@types'
function PolicyItem({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <li>
      <span className='block font-utekos-text-medium text-white'>
        {title}
      </span>
      <span className='block text-white/90'>{children}</span>
    </li>
  )
}
export const lastUpdated = '8. juni 2026'
export const privacySections: Section[] = [
  {
    id: 'introduksjon',
    title: 'Introduksjon',
    content: (
      <>
        <p>
          Utekos driver denne butikken og dette nettstedet,
          inkludert all relatert informasjon, innhold, verktøy og
          funksjoner, for å gi deg en tilpasset handleopplevelse
          («tjenestene»). Utekos bruker Shopify som plattform.
        </p>
        <p>
          Denne personvernerklæringen beskriver hvordan vi samler
          inn, bruker og deler personopplysninger når du bruker,
          besøker eller gjennomfører kjøp via tjenestene, eller
          kommuniserer med oss på andre måter. Ved konflikt
          mellom vilkår for bruk og denne erklæringen, gjelder
          denne erklæringen for innsamling, behandling og deling
          av personopplysninger.
        </p>
        <p>
          Les erklæringen nøye. Ved å bruke tjenestene bekrefter
          du at du har lest den og forstår hvordan informasjonen
          din behandles.
        </p>
      </>
    )
  },
  {
    id: 'personopplysninger',
    title: 'Personopplysninger vi samler inn eller behandler',
    content: (
      <>
        <p>
          «Personopplysninger» er informasjon som identifiserer
          deg, eller med rimelighet kan knyttes til deg eller en
          annen person. Dette omfatter ikke data som er samlet
          inn anonymt eller anonymisert. Kategorier vi kan samle
          inn, avhengig av din interaksjon, bosted og lovverk:
        </p>
        <ul className='space-y-4'>
          <PolicyItem title='Kontaktinfo'>
            Navn, adresse, faktura- og leveringsadresse,
            telefonnummer, e-post.
          </PolicyItem>
          <PolicyItem title='Økonomisk informasjon'>
            Kreditt-/debetkort og kontonumre,
            betalingskortinformasjon, kontoinformasjon,
            transaksjonsinformasjon, betalingsmåte og
            bekreftelser.
          </PolicyItem>
          <PolicyItem title='Kontoinformasjon'>
            Brukernavn, passord, sikkerhetsspørsmål, preferanser
            og innstillinger.
          </PolicyItem>
          <PolicyItem title='Transaksjonsinformasjon'>
            Varer du ser på, legger i handlekurv/ønskeliste,
            kjøper, returnerer eller bytter, samt tidligere
            transaksjoner.
          </PolicyItem>
          <PolicyItem title='Kommunikasjon'>
            Opplysninger du deler med oss i kundedialoger.
          </PolicyItem>
          <PolicyItem title='Enhetsinformasjon'>
            Enhet, nettleser, nettverksforbindelse, IP-adresse og
            andre identifikatorer.
          </PolicyItem>
          <PolicyItem title='Bruksinformasjon'>
            Hvordan og når du samhandler med eller navigerer i
            tjenestene.
          </PolicyItem>
        </ul>
      </>
    )
  },
  {
    id: 'kilder',
    title: 'Kilder til personopplysninger',
    content: (
      <ul className='space-y-4'>
        <PolicyItem title='Direkte fra deg'>
          Når du oppretter konto, bruker tjenestene, kommuniserer
          med oss eller gir opplysninger.
        </PolicyItem>
        <PolicyItem title='Automatisk via tjenestene'>
          Fra enheten din ved bruk av våre produkter og
          nettsteder, inkludert informasjonskapsler og lignende
          teknologier.
        </PolicyItem>
        <PolicyItem title='Tjenesteleverandører'>
          Når de muliggjør teknologier eller behandler
          opplysninger på våre vegne.
        </PolicyItem>
        <PolicyItem title='Partnere og andre tredjeparter'>
          Når vi mottar opplysninger i samsvar med gjeldende
          regelverk og avtaler.
        </PolicyItem>
      </ul>
    )
  },
  {
    id: 'bruk',
    title: 'Slik bruker vi personopplysningene dine',
    content: (
      <>
        <p>
          Avhengig av din interaksjon og hvilke tjenester du
          bruker, kan vi bruke data til:
        </p>
        <ul className='space-y-4'>
          <PolicyItem title='Tilby, tilpasse og forbedre tjenestene'>
            Inkl. å oppfylle avtaler, behandle betalinger,
            distribuere bestillinger, huske preferanser, sende
            kontovarsler, håndtere kjøp/retur/bytte,
            opprette/vedlikeholde konto, organisere frakt,
            muliggjøre returer og anmeldelser, og anbefale
            relevante produkter.
          </PolicyItem>

          <PolicyItem title='Markedsføring og annonsering'>
            Sende ut kampanjer på e-post/SMS/post og vise
            annonser på våre/andres nettsteder, også basert på
            tidligere aktivitet.
          </PolicyItem>

          <PolicyItem title='Sikkerhet og svindelforebygging'>
            Autentisere konto, sikre betalings-/handleopplevelse,
            oppdage/undersøke/iverksette tiltak mot svindel,
            ulovlig eller ondsinnet aktivitet, beskytte offentlig
            sikkerhet og sikre tjenestene. Du er ansvarlig for å
            holde påloggingsinfo trygg.
          </PolicyItem>

          <PolicyItem title='Kommunikasjon'>
            Kundestøtte, svare på henvendelser og vedlikeholde
            kundeforhold.
          </PolicyItem>

          <PolicyItem title='Juridiske formål'>
            Overholde lover og forespørsler fra myndigheter,
            delta i rettsprosesser og håndheve
            vilkår/retningslinjer.
          </PolicyItem>
        </ul>
      </>
    )
  },
  {
    id: 'fremlegging',
    title: 'Slik fremlegger vi personopplysninger',
    content: (
      <>
        <ul className='space-y-4'>
          <PolicyItem title='Shopify, forhandlere og leverandører'>
            Utfører tjenester som IT-drift, betaling, analyse,
            kundestøtte, skytjenester, distribusjon og frakt.
          </PolicyItem>
          <PolicyItem title='Bedrifter og markedsføringspartnere'>
            Markedsføring og annonser, inkludert personrettet
            annonsering når lovlig.
          </PolicyItem>
          <PolicyItem title='Etter instruksjon eller samtykke fra deg'>
            For eksempel for frakt eller ved bruk av sosiale
            innlogginger og widgeter.
          </PolicyItem>
          <PolicyItem title='Samarbeidspartnere og konsernforbindelser'>
            Deling når nødvendig og tillatt.
          </PolicyItem>
          <PolicyItem title='Forretningstransaksjoner og rettslige formål'>
            Ved fusjon, oppkjøp eller insolvens, for å etterleve
            lovkrav, håndheve vilkår og beskytte rettigheter.
          </PolicyItem>
        </ul>
      </>
    )
  },
  {
    id: 'shopify',
    title: 'Forholdet til Shopify',
    content: (
      <>
        <p>
          Shopify er plattformen for tjenestene og behandler
          personopplysninger knyttet til bruken for å levere og
          forbedre tjenestene. Opplysninger kan overføres til og
          deles med Shopify og tredjeparter i andre land. For
          avanserte funksjoner kan Shopify bruke
          personopplysninger fra din samhandling med vår butikk,
          andre forhandlere og Shopify.
        </p>
        <p>
          I slike tilfeller er Shopify behandlingsansvarlig for
          den aktuelle bruken og svarer på
          rettighetsforespørsler. Les mer hos Shopify:{' '}
          <a
            href='https://privacy.shopify.com/en'
            target='_blank'
            rel='noopener noreferrer'
          >
            privacy.shopify.com/en
          </a>
          .
        </p>
      </>
    )
  },
  {
    id: 'informasjonskapsler',
    title: 'Informasjonskapsler og samtykke',
    content: (
      <>
        <p>
          Cookiebot CMP er vår samtykkeplattform. Den registrerer
          og dokumenterer valgene dine for nødvendige,
          funksjonelle, statistiske og markedsføringsrelaterte
          informasjonskapsler.
        </p>
        <p>
          Statistikksamtykke brukes blant annet til
          produktanalyse. Markedsføringssamtykke kan brukes til
          konverteringsmåling, kundematching og deling av hash’et
          e-postadresse eller telefonnummer med annonsepartnere.
          Slike data sendes ikke uten gyldig
          markedsføringssamtykke.
        </p>
        <p>
          Du kan når som helst endre eller trekke tilbake
          samtykket via «Innstillinger for informasjonskapsler»
          nederst på nettstedet.
        </p>
      </>
    )
  },
  {
    id: 'tredjeparter',
    title: 'Tredjeparts nettsteder og koblinger',
    content: (
      <>
        <p>
          Tjenestene kan inneholde lenker til
          tredjepartsnettsteder. Gjennomgå deres sikkerhets- og
          personvernregler. Vi er ikke ansvarlige for personvern
          eller sikkerhet hos slike aktører, herunder nøyaktighet
          eller pålitelighet av informasjon. Informasjon du deler
          i offentlige eller halvoffentlige fora kan være synlig
          for andre. Lenker impliserer ikke støtte utover det som
          beskrives i tjenestene.
        </p>
      </>
    )
  },
  {
    id: 'barn',
    title: 'Data om barn',
    content: (
      <>
        <p>
          Tjenestene er ikke beregnet på barn, og vi samler ikke
          bevisst inn data om barn under myndighetsalder.
          Foresatte som oppdager at barn har delt data kan
          kontakte oss for sletting. Per ikrafttredelsesdato
          kjenner vi ikke til at vi deler eller selger data om
          personer under 16 år.
        </p>
      </>
    )
  },
  {
    id: 'sikkerhet-oppbevaring',
    title: 'Sikkerhet og oppbevaring av informasjonen din',
    content: (
      <>
        <p>
          Ingen sikkerhetstiltak er perfekte, og vi kan ikke
          garantere full sikkerhet. Informasjon kan være utsatt
          under overføring. Ikke bruk usikre kanaler for sensitiv
          informasjon.
        </p>
        <p>
          Oppbevaringstiden bestemmes av formål, juridiske krav,
          tvisteløsning og våre kontrakter og retningslinjer.
        </p>
      </>
    )
  },
  {
    id: 'rettigheter',
    title: 'Dine rettigheter og valg',
    content: (
      <>
        <p>Avhengig av bosted kan du ha følgende rettigheter:</p>
        <ul className='space-y-4'>
          <PolicyItem title='Innsyn'>
            Få tilgang til personopplysninger vi lagrer om deg.
          </PolicyItem>
          <PolicyItem title='Sletting'>
            Be om sletting av personopplysninger når vilkårene er
            oppfylt.
          </PolicyItem>
          <PolicyItem title='Rettelse'>
            Kreve at uriktige eller ufullstendige opplysninger
            korrigeres.
          </PolicyItem>
          <PolicyItem title='Dataportabilitet'>
            Motta eller få overført data i et strukturert og
            maskinlesbart format i visse tilfeller.
          </PolicyItem>
          <PolicyItem title='Kommunikasjonspreferanser'>
            Avslutt reklame-epost via «stopp abonnement». Vi kan
            fortsatt sende ikke-markedsføringsrelatert e-post om
            konto og bestillinger.
          </PolicyItem>
          <PolicyItem title='EØS/Storbritannia'>
            I tillegg kan du protestere mot eller begrense
            behandling og trekke samtykke uten å påvirke
            lovligheten av tidligere behandling.
          </PolicyItem>
        </ul>
        <p>
          Rettigheter kan utøves via tjenestene eller ved å
          kontakte oss. Vi kan måtte bekrefte identitet. Du kan
          utpeke en representant med dokumentasjon, og vi kan be
          om at du bekrefter identitet direkte. Vi svarer
          innenfor lovpålagte frister. Ingen gjengjeldelse for å
          utøve rettigheter.
        </p>
        <p>
          Mer om hvordan Shopify behandler personopplysninger og
          dine rettigheter:{' '}
          <a
            href='https://privacy.shopify.com/en'
            target='_blank'
            rel='noopener noreferrer'
          >
            privacy.shopify.com/en
          </a>
          .
        </p>
      </>
    )
  },
  {
    id: 'klager',
    title: 'Klager',
    content: (
      <>
        <p>
          Er du uenig i hvordan vi behandler personopplysninger,
          kontakt oss først. Avhengig av bosted kan du ha rett
          til å anke vår beslutning ved å kontakte oss, eller
          klage til din lokale tilsynsmyndighet for
          databeskyttelse (EØS: se oversikt over nasjonale
          tilsynsmyndigheter).
        </p>
      </>
    )
  },
  {
    id: 'overforinger',
    title: 'Internasjonale overføringer',
    content: (
      <>
        <p>
          Vi kan overføre, lagre og behandle personopplysninger
          utenfor landet du bor i. Ved overføring ut av EØS eller
          Storbritannia bruker vi anerkjente mekanismer som
          Europakommisjonens standard personvernbestemmelser
          (SCC) eller tilsvarende, med mindre mottakerlandet har
          et tilstrekkelig beskyttelsesnivå.
        </p>
      </>
    )
  },
  {
    id: 'endringer',
    title: 'Endringer i denne personvernerklæringen',
    content: (
      <>
        <p>
          Vi kan oppdatere erklæringen for å reflektere endringer
          i praksis eller av driftsmessige, juridiske eller
          regulatoriske årsaker. Vi publiserer oppdatert versjon,
          oppdaterer «Sist oppdatert», og varsler der loven
          krever det.
        </p>
      </>
    )
  },
  {
    id: 'kontakt',
    title: 'Kontakt',
    content: (
      <>
        <p>
          Spørsmål om personvern eller ønsker du å utøve
          rettigheter?
        </p>
        <ul className='space-y-4'>
          <PolicyItem title='E-post'>
            <a href='mailto:kundeservice@utekos.no'>
              kundeservice@utekos.no
            </a>
          </PolicyItem>
          <PolicyItem title='Adresse'>
            Lille Damsgårdsveien 25, 1, 5162 Bergen, Norge
          </PolicyItem>
        </ul>
        <p>
          I henhold til gjeldende databeskyttelseslover er Utekos
          behandlingsansvarlig.
        </p>
      </>
    )
  }
]
