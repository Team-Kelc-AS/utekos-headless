import { PackageOpen, WashingMachine, Wind, Archive } from 'lucide-react'
import type { CareStep } from '../types'

export function getCareSteps(): CareStep[] {
  return [
    {
      id: 'forberedelse',
      step: 'Steg 1',
      title: 'Forberedelse',
      icon: PackageOpen,
      content: (
        <>
          <p>
            Lukk alle glidelåser, fest borrelås og tøm lommer. Vreng plagget før vask – det skåner
            ytterstoffet og bevarer DWR-behandlingen som gjør at vann preller av.
          </p>
          <p className='opacity-90'>
            Sjekk vaskelappen for materialspesifikke detaljer. Hvert Utekos-plagg er merket med presise
            instruksjoner for nettopp den sammensetningen.
          </p>
        </>
      )
    },
    {
      id: 'vask',
      step: 'Steg 2',
      title: 'Vask',
      icon: WashingMachine,
      content: (
        <>
          <p>
            Vask på skånsomt program med kaldt eller lunkent vann og et mildt vaskemiddel uten optisk hvitt.
            Fyll trommelen halvfull – plagget trenger plass for å bli skikkelig rent.
          </p>
          <p className='opacity-90'>
            Unngå tøymykner. Det legger seg som en usynlig film over fibrene og reduserer både pusteegenskaper
            og isolasjon over tid.
          </p>
        </>
      )
    },
    {
      id: 'torking',
      step: 'Steg 3',
      title: 'Tørking',
      icon: Wind,
      content: (
        <>
          <p>
            For dun: tørketrommel på lav varme med tørkeballer eller rene tennisballer. Avbryt syklusen et par
            ganger og rist plagget for å løse opp eventuelle klumper.
          </p>
          <p className='opacity-90'>
            For mikrofiber: heng plagget luftig. Det tørker raskt og bevarer fiberstrukturen best uten
            varmebehandling. Plagget skal være 100 % gjennomtørt før neste steg.
          </p>
        </>
      )
    },
    {
      id: 'oppbevaring',
      step: 'Steg 4',
      title: 'Oppbevaring',
      icon: Archive,
      content: (
        <>
          <p>
            Heng plagget på en stødig henger i et tørt og luftig skap mellom sesongene. Dunet trenger luft for
            å bevare spensten som gir varmen.
          </p>
          <p className='opacity-90'>
            Unngå kompresjonsposer og plastomslag over lengre tid. Kortvarig pakking under reise er greit –
            langtidslagring komprimert er ikke.
          </p>
        </>
      )
    }
  ]
}
