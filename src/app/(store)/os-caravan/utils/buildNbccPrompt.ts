import type { NbccAiSummaryIntent } from '../types'
import { techDownSizeSummary } from '@/app/handlehjelp/storrelsesguide/utils/techDownSizeSummary'
import { formatProductFacts } from './formatProductFacts'
import { formatStepFacts } from './formatStepFacts'
import { formatFaqFacts } from './formatFaqFacts'
import { formatComfyrobeSizeFacts } from './formatComfyrobeSizeFacts'
import { formatTechDownSizeFacts } from './formatTechDownSizeFacts'
import { formatMikrofiberSizeFacts } from './formatMikrofiberSizeFacts'

export function buildNbccPrompt(
  intent: NbccAiSummaryIntent
): string {
  const task =
    intent === 'how-to-use' ?
      `Oppgave: Forklar NBCC-fordelen på en måte som føles varm, presis og nyttig for et NBCC-medlem som allerede er på Utekos-siden.

Svaret skal ha denne strukturen:
- intro: én varm introduksjon om samarbeidet med NBCC og medlemsrabatten.
- sections[0]: "Støtt din lokalavdeling" med forklaring om lokalavdelingens dedikerte rabattkode.
- sections[1]: "Hvor finner jeg koden?" med forklaring om Min Side hos NBCC og Gnist-appen.
- sections[2]: "Slik bruker du fordelen din" som steg-for-steg-liste.

Viktig:
- Ikke lag en avsluttende oppsummering.
- Ikke skriv "Det viktigste er enkelt".
- Ikke lag tre varianter av samme forklaring.
- Ikke bruk en CTA som sender brukeren bort fra Utekos.
- Ikke skriv "for eksempel" om Min Side eller Gnist.
- Ikke anta at kunden skal på tur.
- Bruk "Utekos-favorittene dine" eller tilsvarende inkluderende formulering.
- Forklar at rabattkoden skrives inn i kassen og at rabatten trekkes fra før betaling.
- Ikke legg til prosenter, priser eller vilkår som ikke står i fakta.`
    : `Oppgave: Lag en størrelsesveiledning som hjelper NBCC-medlemmer å velge riktig Utekos-størrelse.

Svaret skal ha denne strukturen:
- title: "Finn din størrelse"
- intro: vennlig forklaring om at Utekos er romslig, lunt, behagelig og justerbart. Første setning må være nøyaktig: "Det er enklere enn du tror!"
- Én seksjon for Utekos TechDown™.
- Én seksjon for Utekos Mikrofiber™.
- Én seksjon for Comfyrobe™.

Viktig:
- Ikke lag en avsluttende oppsummering.
- Ikke bare list størrelsesnavn.
- Bruk nyttige mål, spesielt total lengde.
- Bruk bare TechDown-størrelsene Middels, Stor og Større, med høyderådene og målene fra fakta under.
- Mikrofiber Medium: total lengde 170 cm, opptil ca. 180 cm, lettere klær.
- Mikrofiber Large: total lengde 200 cm, over 180 cm eller mer plass til tykke lag.
- Comfyrobe: forklar den som et beskyttende skall, romslig rektangulær passform, forlenget rygg, splitter og justerbare ermer.
- Comfyrobe S: total lengde 97 cm.
- Comfyrobe L: total lengde 113 cm.
- Ikke skriv tørt metaspåk som "samlet kan størrelsene leses".
- Ikke skriv "NBCC-utvalget bruker ulike størrelsesnavn".`

  return `Du er en erfaren norsk kundeservice- og produktveileder for Utekos sin NBCC-landingsside.

Kontekst:
- Leseren er NBCC-medlem eller vurderer å bruke NBCC-medlemsfordelen.
- Leseren er på Utekos sin NBCC-side akkurat nå.
- Målet ditt er å øke trygghet, redusere friksjon og gjøre neste handling enkel.
- Tonen skal være vennlig, trygg, kompetent og konkret.
- Skriv som en motivert kundeservice-ansatt med full kontroll, ikke som en intern produktdatabase.

${task}

Generelle regler:
- Skriv på norsk bokmål.
- Bruk "du".
- Basér deg kun på fakta under.
- Ikke bruk emoji.
- Ikke nevn AI, prompt, data eller oppsummering.
- Ikke bruk markdown.
- Ikke skriv overforklarende eller internt.
- Returner strukturert innhold som matcher skjemaet.

Produkter på NBCC-siden:
${formatProductFacts()}

Slik brukes fordelen:
${formatStepFacts()}

FAQ-fakta:
${formatFaqFacts()}

Størrelsesguide — Comfyrobe:
Comfyrobe er oversized og beskyttende. Den er ment å kunne trekkes over klær og gi god bevegelsesfrihet.
Beste tips: Velg normal størrelse for romslig, men kontrollerbar passform. Vurder større størrelse hvis kunden vil ha maksimal plass til tykke lag eller en bevisst overdimensjonert stil.
${formatComfyrobeSizeFacts()}

Størrelsesguide — TechDown:
TechDown har normal passform (regular), balansert over skuldre, bryst og ermer, justerbar midje og nettere design.
${techDownSizeSummary.join('\n')}
${formatTechDownSizeFacts()}

Størrelsesguide — Mikrofiber:
Mikrofiber/Utekos har stor forskjell mellom Medium og Large. Passformen kan formes med snorstramming i livet og nederst.
Medium: total lengde fra nakke til bunn er 170 cm. Opptil ca. 180 cm, generøs men tettere passform, best over lettere klær.
Large: total lengde fra nakke til bunn er 200 cm. Over 180 cm, eller hvis kunden ønsker oversized følelse, maksimal plass til tykke lag og mer kokong-effekt.
${formatMikrofiberSizeFacts()}`
}
