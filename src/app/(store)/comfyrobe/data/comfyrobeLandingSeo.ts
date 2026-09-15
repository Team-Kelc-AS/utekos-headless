import { SITE_URL } from '@/constants'

export const COMFYROBE_LANDING_PATH = '/comfyrobe'
export const COMFYROBE_LANDING_URL = `${SITE_URL}${COMFYROBE_LANDING_PATH}`
export const COMFYROBE_PRODUCT_HANDLE = 'comfyrobe'
export const COMFYROBE_PRODUCT_URL = `${SITE_URL}/produkter/${COMFYROBE_PRODUCT_HANDLE}`

export const COMFYROBE_LANDING_NAME =
  'Comfyrobe™ XL – lang og romslig allværsjakke | Utekos'

export const COMFYROBE_LANDING_DESCRIPTION =
  'Lang og romslig unisex allværsjakke med 8 000 mm vannsøyle, varmt SherpaCore™-fôr og toveis YKK®-glidelås. Se Comfyrobe™ XL fra Utekos.'
export const COMFYROBE_LANDING_IMAGE = `${SITE_URL}/og-comfyrobe-1200x630.jpg`

export const COMFYROBE_LANDING_FAQ = [
  {
    question: 'Hvordan er passformen?',
    answer:
      'Passformen er bevisst romslig og unisex, slik at roben enkelt kan brukes over vanlige klær eller flere lag. Sidesplitter gir ekstra bevegelsesfrihet.'
  },
  {
    question: 'Er Comfyrobe™ vanntett?',
    answer:
      'Comfyrobe™ har et værbeskyttende skall med 8 000 mm vannsøyle og pustende membran. Den er utviklet for regn, vind og skiftende norsk hverdagsvær.'
  },
  {
    question: 'Hvor varm er Comfyrobe™?',
    answer:
      'Innsiden er fôret med myk SherpaCore™ 250 GSM. Den gir lun komfort på kalde og vindfulle dager, samtidig som den pustende membranen slipper ut overskuddsvarme i aktivitet.'
  },
  {
    question: 'Kan jeg returnere Comfyrobe™?',
    answer:
      'Ja. Du har 14 dagers returrett. Prøv passformen hjemme og følg returinstruksjonene dersom størrelsen ikke blir riktig.'
  },
  {
    question: 'Kan den brukes som vanlig jakke?',
    answer:
      'Ja. Comfyrobe™ er laget for allvær og hverdagsbruk, som hundelufting, hytteterrasse, brygge, camping, sidelinje og raske ærender.'
  },
  {
    question: 'Passer den etter isbading?',
    answer:
      'Ja. Det romslige snittet og det myke fôret gjør den godt egnet etter isbading og andre vannaktiviteter, men siden er først og fremst utviklet rundt bred allværs- og hverdagsbruk.'
  }
] as const
