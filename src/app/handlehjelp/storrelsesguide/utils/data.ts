export const comfyrobeData = [
  {
    measurement: 'Total lengde (fra HSP til front)',
    xs: '97 cm',
    ml: '105 cm',
    lxl: '113 cm'
  },
  {
    measurement: 'Glidelåslengde',
    xs: '85 cm',
    ml: '90 cm',
    lxl: '95 cm'
  },
  {
    measurement: 'Bredde over bryst',
    xs: '65 cm',
    ml: '71 cm',
    lxl: '77 cm'
  },
  {
    measurement: 'Ermelengde',
    xs: '57 cm',
    ml: '63 cm',
    lxl: '66 cm'
  },
  {
    measurement: 'Skulderbredde',
    xs: '53 cm',
    ml: '62 cm',
    lxl: '71 cm'
  },
  {
    measurement: 'Mansjettbredde',
    xs: '14 1/2 cm',
    ml: '18 cm',
    lxl: '18 1/2 cm'
  },
  {
    measurement: 'Mansjetthøyde',
    xs: '6 cm',
    ml: '6 cm',
    lxl: '6 cm'
  },
  {
    measurement: 'Splitt-høyde',
    xs: '16 cm',
    ml: '18 cm',
    lxl: '20 cm'
  },
  {
    measurement: 'Kragehøyde',
    xs: '11 cm',
    ml: '11 cm',
    lxl: '11 cm'
  },
  {
    measurement: 'Lommehøyde',
    xs: '18 cm',
    ml: '20 cm',
    lxl: '22 cm'
  },
  {
    measurement: 'Hettehøyde',
    xs: '35 cm',
    ml: '38 cm',
    lxl: '40 cm'
  },
  {
    measurement: 'Hettebredde',
    xs: '27 cm',
    ml: '30 cm',
    lxl: '32 cm'
  },
  {
    measurement: 'Underarmsbredde',
    xs: '19 cm',
    ml: '21 cm',
    lxl: '23 cm'
  },
  {
    measurement: 'Ermehull',
    xs: '32 cm',
    ml: '35 cm',
    lxl: '38 cm'
  }
]

export const utekosData = [
  {
    measurement: 'Total lengde (nakke til bunn)',
    m: '170 cm',
    l: '200 cm'
  },
  {
    measurement: 'Brystvidde (flatmål)',
    m: '66 cm',
    l: '75 cm'
  },
  {
    measurement: 'Armlengde (fra senter bryst)',
    m: '85 cm',
    l: '100 cm'
  },
  {
    measurement: 'Armlengde (fra kropp)',
    m: '55 cm',
    l: '65 cm'
  },
  {
    measurement: 'Bredde nederst (flatmål)',
    m: '66 cm',
    l: '75 cm'
  },
  {
    measurement: 'Lengde på glidelås (V-hals)',
    m: '73 cm',
    l: '85.5 cm'
  },
  { measurement: 'Høyde på hette', m: '35 cm', l: '35 cm' },
  { measurement: 'Høyde på baklomme', m: '42 cm', l: '42 cm' },
  {
    measurement: 'Fullengde inkl. hette',
    m: '205 cm',
    l: '235 cm'
  }
]

export type TechDownMeasurementRow = Readonly<{
  measurement: string
  middels: string
  stor: string
  storre: string
}>

export const techDownData = [
  {
    measurement: 'Total lengde (nakke til bunn)',
    middels: '162 cm',
    stor: '166 cm',
    storre: '170 cm'
  },
  {
    measurement: 'Brystvidde (flatmål)',
    middels: '56 cm',
    stor: '58 cm',
    storre: '61 cm'
  },
  {
    measurement: 'Ermlengde (fra senter)',
    middels: '82 cm',
    stor: '87 cm',
    storre: '92 cm'
  },
  {
    measurement: 'Ermlengde (fra armhule)',
    middels: '54 cm',
    stor: '60 cm',
    storre: '64 cm'
  },
  {
    measurement: 'Lengde på glidelås (omvendt V)',
    middels: '73 cm',
    stor: '74 cm',
    storre: '75 cm'
  },
  {
    measurement: 'Lengde på glidelås (sidelomme)',
    middels: '13,5 cm',
    stor: '13,5 cm',
    storre: '14 cm'
  },
  {
    measurement: 'Høyde på hette',
    middels: '35 cm',
    stor: '35 cm',
    storre: '35 cm'
  },
  {
    measurement: 'Høyde på baklomme',
    middels: '29 cm',
    stor: '29 cm',
    storre: '29 cm'
  },
  {
    measurement: 'Mansjetthøyde',
    middels: '8 cm',
    stor: '8,5 cm',
    storre: '9 cm'
  }
] as const satisfies readonly TechDownMeasurementRow[]
