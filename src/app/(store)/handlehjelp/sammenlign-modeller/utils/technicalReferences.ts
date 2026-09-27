// Preserve the material designation and test conditions for each reference.
export const technicalReferences = [
  {
    id: 'sintef',
    number: 1,
    author: 'SINTEF',
    title: 'Slik kler du deg i kulde – fra topp til tå',
    year: '2021',
    url: 'https://www.sintef.no/siste-nytt/2021/slik-kler-du-deg-i-kulda-fra-topp-til-ta/',
    description:
      'Forskningsformidling om aktivitet, fukt og bekledning. Generell veiledning, ikke en test av Utekos.'
  },
  {
    id: '3m',
    number: 2,
    author: '3M',
    title:
      '3M™ Thinsulate™ Insulation Type C – Technical Data Sheet',
    year: '2016',
    url: 'https://multimedia.3m.com/mws/media/745367O/3m-thinsulate-insulation-type-c-technical-data-sheet-pdf.pdf',
    description:
      'Datablad for Thinsulate Type C/CS/CDS med typiske CLO-verdier, arealvekt og ASTM F1868 som målemetode. Verdiene er materialmålinger for de oppgitte variantene og arealvektene.'
  },
  {
    id: 'klinkhammer',
    number: 3,
    author:
      'Klinkhammer, Kolbe, Brandt, Meyer, Ratovo, Bendt og Rabe',
    title:
      'Release of fibrous microplastics from functional polyester garments through household washing',
    year: '2024',
    url: 'https://doi.org/10.3389/fenvs.2024.1330922',
    description:
      'Fagfellevurdert studie i Frontiers in Environmental Science, 12:1330922. Undersøker polyesterbaserte plagg og vaskebetingelser, ikke Utekos’ nylonstoff.'
  }
] as const
