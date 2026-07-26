import React from 'react'
import type { Section } from '@types'
import Link from 'next/link'

function PolicyItem({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <li>
      <span className='block font-utekos-text-medium text-foreground'>
        {title}
      </span>
      <span className='block text-muted-foreground'>
        {children}
      </span>
    </li>
  )
}

export const lastUpdated = '03. november 2025'

export const termsSections: Section[] = [
  {
    id: 'oversikt',
    title: 'Oversikt',
    content: (
      <>
        <p>
          Dette nettstedet drives av KELC AS. I hele nettstedet
          viser «vi», «oss» og «vår» til KELC AS. KELC AS tilbyr
          dette nettstedet, inkludert all informasjon, verktøy og
          tjenester som er tilgjengelige her, til deg som bruker,
          under forutsetning av at du aksepterer alle vilkår,
          betingelser, retningslinjer og meldinger som fremgår
          her.
        </p>
        <p>
          Ved å besøke nettstedet vårt og/eller kjøpe noe fra
          oss, tar du i bruk «Tjenesten» og samtykker i å være
          bundet av disse vilkårene («Vilkår»). Dette inkluderer
          tilleggsvilkår og retningslinjer det refereres til her
          og/eller via lenke. Vilkårene gjelder for alle brukere
          av nettstedet.
        </p>
        <p>
          Les vilkårene nøye før bruk. Ved å bruke noen del av
          nettstedet godtar du vilkårene. Dersom du ikke godtar
          vilkårene, kan du ikke bruke nettstedet eller
          tjenestene. Dersom disse vilkårene anses som et tilbud,
          er aksept uttrykkelig begrenset til disse vilkårene.
        </p>
        <p>
          Nye funksjoner eller verktøy i butikken omfattes også
          av vilkårene. Du kan når som helst se den nyeste
          versjonen på denne siden. Vi kan oppdatere, endre eller
          erstatte deler av vilkårene ved å publisere
          oppdateringer. Det er ditt ansvar å sjekke siden
          periodisk. Fortsatt bruk etter endringer innebærer
          aksept.
        </p>
        <p>
          Frontenden er utviklet i Next.js og hostes på Vercel.
          Produktkatalog, kasse og ordrebehandling leveres av
          Shopify, som fungerer som vår handelsplattform.
        </p>
      </>
    )
  },
  {
    id: '1-nettbutikkens-vilkar',
    title: 'Nettbutikkens vilkår',
    content: (
      <>
        <ul className='space-y-4'>
          <PolicyItem title='Myndighetsalder'>
            Du bekrefter at du er myndig i din jurisdiksjon,
            eller at du er myndig og har gitt samtykke til at
            mindreårige du har ansvar for kan bruke nettstedet.
          </PolicyItem>
          <PolicyItem title='Lovlydig bruk'>
            Du skal ikke bruke produktene til ulovlige eller
            uautoriserte formål, og du skal ikke bryte gjeldende
            lover ved bruk av tjenesten, inkludert opphavsrett.
          </PolicyItem>
          <PolicyItem title='Skadelig kode'>
            Du må ikke overføre ormer, virus eller annen
            destruktiv kode.
          </PolicyItem>
          <PolicyItem title='Brudd'>
            Brudd på vilkårene kan medføre umiddelbar avslutning
            av tjenestene.
          </PolicyItem>
        </ul>
      </>
    )
  },
  {
    id: '2-generelle-betingelser',
    title: 'Generelle betingelser',
    content: (
      <>
        <ul className='space-y-4'>
          <PolicyItem title='Rett til å nekte tjeneste'>
            Vi kan nekte tjeneste til hvem som helst, av hvilken
            som helst grunn, når som helst.
          </PolicyItem>
          <PolicyItem title='Overføring av innhold'>
            Innholdet ditt (ikke kredittkortdata) kan overføres
            ukryptert over nettverk og tilpasses tekniske krav.
            Kredittkortdata krypteres alltid under overføring.
          </PolicyItem>
          <PolicyItem title='Utnyttelse av tjenesten'>
            Uten skriftlig tillatelse kan du ikke reprodusere,
            kopiere, selge, videreselge eller utnytte tjenesten,
            tilgang til den eller kontakter på nettstedet.
          </PolicyItem>
          <PolicyItem title='Overskrifter'>
            Overskrifter er kun for bekvemmelighet og begrenser
            ikke vilkårene.
          </PolicyItem>
        </ul>
      </>
    )
  },
  {
    id: '3-informasjon-noyaktighet',
    title: 'Nøyaktighet, fullstendighet og aktualitet',
    content: (
      <>
        <p>
          Informasjon på nettstedet kan være unøyaktig,
          ufullstendig eller utdatert. Materialet er kun for
          generell informasjon og skal ikke brukes alene som
          beslutningsgrunnlag. Bruk skjer på egen risiko.
        </p>
        <p>
          Nettstedet kan inneholde historisk informasjon. Vi kan
          endre innholdet når som helst, men er ikke forpliktet
          til å oppdatere. Du har ansvar for å overvåke
          endringer.
        </p>
      </>
    )
  },
  {
    id: '4-endringer-og-priser',
    title: 'Endringer i tjenesten og priser',
    content: (
      <>
        <ul className='space-y-4'>
          <PolicyItem title='Priser'>
            Priser kan endres uten varsel.
          </PolicyItem>
          <PolicyItem title='Endringer'>
            Vi kan endre eller avvikle tjenesten når som helst
            uten varsel.
          </PolicyItem>
          <PolicyItem title='Ansvarsfraskrivelse'>
            Vi er ikke ansvarlige overfor deg eller tredjeparter
            for slike endringer, prisendringer, suspensjon eller
            avvikling.
          </PolicyItem>
        </ul>
      </>
    )
  },
  {
    id: '5-produkter-tjenester',
    title: 'Produkter eller tjenester',
    content: (
      <>
        <ul className='space-y-4'>
          <PolicyItem title='Tilgjengelighet og retur'>
            Enkelte produkter/tjenester er kun tilgjengelige på
            nett og kan ha begrensede antall. Retur/bytte følger
            vår refusjonspolicy:{' '}
            <Link href='/frakt-og-retur'>Frakt og retur</Link>
          </PolicyItem>
          <PolicyItem title='Farger og bilder'>
            Vi forsøker å vise farger/bilder nøyaktig, men kan
            ikke garantere at skjermen din gjengir korrekt.
          </PolicyItem>
          <PolicyItem title='Begrensninger'>
            Vi kan begrense salg per person/region/jurisdiksjon
            og mengder, og endre produktbeskrivelser eller priser
            uten varsel. Vi kan avvikle produkter når som helst.
            Tilbud er ugyldige der forbudt.
          </PolicyItem>
          <PolicyItem title='Kvalitet og feil'>
            Vi garanterer ikke at kvaliteten oppfyller
            forventninger eller at feil i tjenesten blir rettet.
          </PolicyItem>
        </ul>
      </>
    )
  },
  {
    id: '6-fakturering-konto',
    title: 'Fakturering og kontoinformasjon',
    content: (
      <>
        <p>
          Vi kan avslå bestillinger og begrense/annullere kvanta
          per kunde, husholdning eller ordre, inkludert etter
          konto, kort eller adresse. Vi kan varsle via e-post
          og/eller oppgitt kontaktinfo. Vi kan forby bestillinger
          som fremstår som fra forhandlere/videreselgere.
        </p>
        <p>
          Du skal gi oppdatert, fullstendig og korrekt kjøps- og
          kontoinformasjon og oppdatere e-post og kortdetaljer
          ved behov.
        </p>
        <p>
          Se også vår refusjonspolicy:{' '}
          <Link href='/frakt-og-retur'>Frakt og retur</Link>
        </p>
      </>
    )
  },
  {
    id: '7-valgfrie-verktoy',
    title: 'Valgfrie verktøy',
    content: (
      <>
        <p>
          Vi kan gi tilgang til tredjepartsverktøy «som de er» og
          «som tilgjengelig» uten garantier eller godkjenning.
          Bruk skjer på eget ansvar og etter gjeldende vilkår hos
          tredjepart. Nye funksjoner/ tjenester på nettstedet vil
          også være underlagt disse vilkårene.
        </p>
      </>
    )
  },
  {
    id: '8-tredjepartslenker',
    title: 'Tredjepartslenker',
    content: (
      <>
        <p>
          Innhold/produkter/tjenester kan inkludere materiale fra
          tredjeparter. Lenker kan føre til eksterne nettsteder
          vi ikke er tilknyttet. Vi garanterer ikke for innhold
          eller nøyaktighet og er ikke ansvarlige for
          transaksjoner med tredjeparter. Les tredjepartens
          vilkår og retningslinjer før du handler. Klager må
          rettes til tredjeparten.
        </p>
      </>
    )
  },
  {
    id: '9-kommentarer-tilbakemeldinger',
    title:
      'Brukerkommentarer, tilbakemeldinger og andre innspill',
    content: (
      <>
        <p>
          Ved innsending av ideer, forslag eller annet materiale
          («kommentarer») godtar du at vi kan redigere, kopiere,
          publisere, distribuere, oversette og bruke dem uten
          begrensning. Vi har ingen plikt til konfidensialitet,
          kompensasjon eller å svare.
        </p>
        <p>
          Vi kan overvåke, redigere eller fjerne innhold som er
          ulovlig, krenkende mv. Du bekrefter at kommentarer ikke
          krenker tredjeparts rettigheter, ikke er ærekrenkende
          eller ulovlige, og ikke inneholder malware. Du kan ikke
          villede om opprinnelsen. Du er alene ansvarlig for
          kommentarene.
        </p>
      </>
    )
  },
  {
    id: '10-personopplysninger',
    title: 'Personopplysninger',
    content: (
      <>
        <p>
          Innsending av personopplysninger reguleres av vår
          personvernerklæring:
          <Link href='/personvern'>Personvern</Link>
        </p>
      </>
    )
  },
  {
    id: '11-feil-og-uteblivelser',
    title: 'Feil, unøyaktigheter og utelatelser',
    content: (
      <>
        <p>
          Det kan forekomme trykkfeil, unøyaktigheter eller
          utelatelser knyttet til beskrivelser, priser,
          kampanjer, frakt, levering og tilgjengelighet. Vi kan
          rette, oppdatere eller kansellere bestillinger uten
          varsel også etter innsending.
        </p>
        <p>
          Vi har ingen plikt til å oppdatere informasjon i
          tjenesten eller på relaterte nettsteder, med mindre lov
          krever det. Angitt oppdateringsdato indikerer ikke at
          all informasjon er endret.
        </p>
      </>
    )
  },
  {
    id: '12-forbudt-bruk',
    title: 'Forbudt bruk',
    content: (
      <>
        <p>
          Forbudt bruk inkluderer blant annet: ulovlige formål;
          oppfordring til ulovlige handlinger; brudd på
          lover/regler; krenkelse av immaterielle rettigheter;
          trakassering eller diskriminering; falsk/misvisende
          informasjon; opplasting av skadelig kode;
          innsamling/sporing av personopplysninger; spam,
          phishing, pharming, pretexting, crawling, scraping;
          uanstendige eller umoralske formål; å forstyrre eller
          omgå sikkerhetsfunksjoner. Brudd kan medføre
          avslutning.
        </p>
      </>
    )
  },
  {
    id: '13-ansvarsfraskrivelse',
    title: 'Ansvarsfraskrivelse og ansvarsbegrensning',
    content: (
      <>
        <p>
          Vi garanterer ikke uavbrutt, tidsriktig, sikker eller
          feilfri tjeneste eller pålitelige resultater. Tjenesten
          kan fjernes midlertidig eller kanselleres uten varsel.
          Bruk skjer på eget ansvar. Tjenesten og produkter
          leveres «som de er» og «som tilgjengelig» uten
          uttrykkelige eller underforståtte garantier.
        </p>
        <p>
          Under ingen omstendigheter skal KELC AS eller våre
          tilknyttede parter være ansvarlige for direkte eller
          indirekte tap, herunder tapt fortjeneste, inntekt,
          besparelser, data, erstatningskostnader eller andre
          følgeskader, selv om vi er varslet om muligheten. Der
          lov begrenser slik ansvarsfraskrivelse, begrenses vårt
          ansvar til lovens maksimum.
        </p>
      </>
    )
  },
  {
    id: '14-skadeslosholdelse',
    title: 'Skadesløsholdelse',
    content: (
      <>
        <p>
          Du samtykker i å holde KELC AS og tilknyttede parter
          skadesløse for krav fra tredjeparter, inkludert
          rimelige advokathonorarer, som følge av ditt brudd på
          vilkårene, refererte dokumenter, lov eller tredjeparts
          rettigheter.
        </p>
      </>
    )
  },
  {
    id: '15-delvis-ugyldighet',
    title: 'Delvis ugyldighet',
    content: (
      <>
        <p>
          Dersom en bestemmelse er ulovlig, ugyldig eller
          ikke-håndhevbar, skal den håndheves så langt loven
          tillater. Den ikke-håndhevbare delen anses skilt ut
          uten å påvirke øvrige bestemmelser.
        </p>
      </>
    )
  },
  {
    id: '16-oppsigelse',
    title: 'Oppsigelse',
    content: (
      <>
        <p>
          Forpliktelser pådratt før oppsigelsesdatoen består.
          Vilkårene gjelder til de sies opp av deg eller oss. Du
          kan si opp ved å avslutte bruk av tjenestene og varsle
          oss. Ved brudd kan vi si opp uten varsel, og du er
          ansvarlig for beløp til og med oppsigelsesdatoen. Vi
          kan nekte videre tilgang.
        </p>
      </>
    )
  },
  {
    id: '17-hele-avtalen',
    title: 'Hele avtalen',
    content: (
      <>
        <p>
          Manglende håndheving er ikke frafallelse. Disse
          vilkårene, sammen med publiserte
          retningslinjer/driftsregler, utgjør hele avtalen og
          erstatter tidligere eller samtidige avtaler og
          kommunikasjon. Uklarhet i tolkning skal ikke tolkes mot
          den som utformet teksten.
        </p>
      </>
    )
  },
  {
    id: '18-lovvalg',
    title: 'Lovvalg',
    content: (
      <>
        <p>Vilkårene reguleres av og tolkes etter norsk lov.</p>
      </>
    )
  },
  {
    id: '19-endringer-i-vilkar',
    title: 'Endringer i vilkårene',
    content: (
      <>
        <p>
          Du kan når som helst se gjeldende versjon på denne
          siden. Vi kan oppdatere, endre eller erstatte deler av
          vilkårene ved å publisere endringer. Du må sjekke
          nettstedet periodisk. Fortsatt bruk etter endringer
          innebærer aksept.
        </p>
      </>
    )
  },
  {
    id: '20-kontakt',
    title: 'Kontaktinformasjon',
    content: (
      <>
        <p>
          Spørsmål om vilkårene sendes til
          kundeservice@utekos.no.
        </p>
      </>
    )
  }
]
