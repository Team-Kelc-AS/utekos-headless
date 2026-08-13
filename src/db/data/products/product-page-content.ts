export type ProductPageHandle =
  | 'utekos-techdown'
  | 'utekos-mikrofiber'
  | 'utekos-dun'
  | 'comfyrobe'
  | 'utekos-stapper'

export type ProductAccordionSectionId =
  | 'materialer'
  | 'funksjoner'
  | 'egenskaper'
  | 'bruksomrader'
  | 'passform'
  | 'vaskeanvisning'

export type ProductDescriptionBlock = {
  title?: string
  paragraphs?: string[]
  items?: string[]
}

export type ProductDescriptionContent = {
  title: string
  lead?: string
  blocks: ProductDescriptionBlock[]
}

export type ProductAccordionGroup = {
  title?: string
  rows?: Array<{ label: string; value: string }>
  paragraphs?: string[]
  items?: string[]
  note?: { title: string; text: string }
}

export type ProductAccordionSection = {
  id: ProductAccordionSectionId
  title: string
  groups: ProductAccordionGroup[]
}

export type ProductPageContent = {
  description: ProductDescriptionContent
  accordion?: ProductAccordionSection[]
}

export const PRODUCT_PAGE_CONTENT = {
  'utekos-techdown': {
    description: {
      title: 'Utekos TechDown™',
      lead: 'Opplev en ny standard for utendørs velvære.',
      blocks: [
        {
          paragraphs: [
            'Utekos TechDown™ kombinerer banebrytende innovasjon med tidløs eleganse. Det eksklusive Luméa™-skallet gir en sofistikert finish og fungerer som et beskyttende skjold, mens den ytelsesoptimaliserte CloudWeave™-isolasjonen gir pålitelig varme under varierende forhold.'
          ]
        },
        {
          title: 'Gjennomtenkt 3-i-1-funksjonalitet',
          paragraphs: [
            'Kjernen i konseptet er vår unike 3-i-1-funksjonalitet. Gjennomtestede løsninger gjør det enkelt å tilpasse passformen etter behov, regulere ventilasjon og veksle mellom ulike funksjonelle moduser.',
            'Når behovene dine endrer seg, justeres produktet slik at komforten opprettholdes uten avbrudd. Utekos TechDown™ fungerer som en mobil varmekilde som gir større frihet og reduserer behovet for omfattende planlegging.'
          ]
        },
        {
          title: 'Mer enn et plagg',
          paragraphs: [
            'Utekos TechDown™ er mer enn et plagg. Det er en ny måte å tenke komfort, fleksibilitet og utendørs velvære på.',
            'Vi ser produktet som en investering i en varig oppdagelsesreise, der forståelsen og verdsettelsen av de gjennomtenkte detaljene vokser over tid.'
          ]
        },
        {
          title: 'Utviklet gjennom erfaring',
          paragraphs: [
            'Vår egen reise startet i 2020. Gjennom erfaring har vi lært at det å definere et produkts bruksområde ofte innebærer å begrense potensialet.',
            'Derfor ønsker vi ikke å bestemme hvordan Utekos TechDown™ skal brukes. Produktets muligheter skal ikke defineres av oss, men av deg som bruker.'
          ]
        }
      ]
    },
    accordion: [
      {
        id: 'materialer',
        title: 'Materialer',
        groups: [
          {
            rows: [
              { label: 'Fôrstoff', value: '100 % polyester' },
              { label: 'Skallstoff', value: '100 % nylon' },
              { label: 'GSM', value: '38' },
              { label: 'Trådtetthet', value: '380T' },
              { label: 'Trådtykkelse', value: '20D' },
              { label: 'Fyll', value: '620 g' },
              { label: 'Vekt', value: '1400 g' },
              { label: 'Glidelåser', value: 'YKK®' }
            ]
          }
        ]
      },
      {
        id: 'funksjoner',
        title: 'Funksjoner',
        groups: [
          {
            title: 'CloudWeave™',
            paragraphs: [
              'Avansert isolasjonsteknologi utviklet for optimal varmeeffekt. Løsningen kombinerer høy isolasjonsgrad med utmerket pusteevne og opprettholder varmen også under fuktige forhold.'
            ]
          },
          {
            title: 'Luméa™',
            paragraphs: [
              'Et slitesterkt, lett og vannavstøtende stoff som oppmuntrer til full loft. Materialet har en matt, myk overflate, pustende egenskaper og robust beskyttelse.'
            ]
          },
          {
            title: 'YKK® Dual V-Zip™',
            paragraphs: [
              'To-spors glidelåssystem med omvendt V-profil. Gir direkte tilgang til innvendig justering og ventilasjon uten at frontpartiet må åpnes helt opp.'
            ]
          },
          {
            title: '3-i-1-funksjonalitet',
            paragraphs: [
              'Modulært system for tilpasning av lengde og mobilitet. Veksle sømløst mellom parkas, oppfestet modus eller fulldekket modus for maksimal isolasjon.'
            ]
          },
          {
            title: 'Isolert og justerbar hette',
            paragraphs: [
              'Romslig konstruksjon med isolasjon. Utformet for god beskyttelse og plass til ekstra bekledning uten å begrense bevegelsesfriheten.'
            ]
          },
          {
            title: 'Spandex-mansjetter',
            paragraphs: [
              'Elastiske mansjetter som slutter tett rundt håndleddet og forsegler overgangen mellom erme og hånd for å forhindre varmetap og kald trekk.'
            ]
          }
        ]
      },
      {
        id: 'egenskaper',
        title: 'Egenskaper',
        groups: [
          {
            title: 'Håndterer fuktige forhold',
            items: [
              'Syntetisk isolasjon konstruert for fuktige og ustabile forhold.',
              'Bevarer isolerende evne når den blir fuktig og tørker raskt.'
            ]
          },
          {
            title: 'Lett, praktisk og vedlikeholdsfri',
            paragraphs: [
              'En lettvekter som enkelt pakkes i medfølgende sekk eller i Utekos Stapper™. Den tar liten plass og krever lite vedlikehold.'
            ]
          },
          {
            title: 'Allergivennlig',
            paragraphs: [
              'Et gjennomtenkt vegansk valg for deg med dunallergi eller for deg som foretrekker produkter uten animalske materialer.'
            ]
          },
          {
            title: 'Robust og allsidig',
            paragraphs: [
              'Bygget for å tåle alt fra gnister fra bålpannen til våte høstturer. En modell for rolig hygge og aktivitet.'
            ]
          },
          {
            title: 'Ubegrenset bevegelsesfrihet',
            paragraphs: [
              'Den romslige unisex-passformen gir frihet til å bevege deg og god plass til ekstra lag med klær under.'
            ]
          }
        ]
      },
      {
        id: 'bruksomrader',
        title: 'Bruksområder',
        groups: [
          {
            title: 'Bygget for virkelighetens bruk',
            paragraphs: [
              'Utekos TechDown™ er konstruert for et levd liv. Med det slitesterke Luméa™-ytterstoffet trenger du ikke være forsiktig, enten du er på hytten, i båten eller ved bålpannen.'
            ]
          },
          {
            title: 'Enkelt vedlikehold',
            paragraphs: [
              'Komfort skal være ukomplisert. Utekos TechDown™ tåler maskinvask og tørker raskt, slik at den alltid er klar for neste eventyr.'
            ]
          },
          {
            title: 'Helhetlig komfortdesign',
            paragraphs: [
              'Hver detalj, fra den lune muffen til mansjettene og hetten, tjener ett formål: å skape en total opplevelse av varme.'
            ]
          }
        ]
      },
      {
        id: 'passform',
        title: 'Passform',
        groups: [
          {
            title: 'Romslig og funksjonell passform',
            paragraphs: [
              'Designet for optimal bevegelsesfrihet, enten du er på tur eller slapper av på hytten. Snittet er sjenerøst og gir god plass til ekstra kleslag uten å føles klumpete.'
            ]
          },
          {
            title: 'Tilpasset beskyttelse mot været',
            paragraphs: [
              'Praktiske strammemuligheter og stretch-mansjetter gjør det enkelt å stenge ute kald vind og ruskevær, slik at varmen holdes på innsiden.'
            ]
          },
          {
            title: 'Finn din perfekte match',
            paragraphs: [
              'Bruk lenken ved størrelsesvelgeren og i menyen over for å se de nøyaktige målene.'
            ]
          }
        ]
      },
      {
        id: 'vaskeanvisning',
        title: 'Vaskeanvisning',
        groups: [
          {
            title: 'Vask og tørk',
            items: [
              'Maskinvask på skånsomt program når det er nødvendig.',
              'Bruk mildt vaskemiddel og unngå blekemiddel.',
              'La plagget lufttørke. Utekos TechDown™ tørker raskt og er utviklet for enkel bruk over tid.'
            ]
          },
          {
            title: 'Lagring',
            paragraphs: [
              'Oppbevar plagget tørt og luftig når det ikke er i bruk. Bruk medfølgende pakksekk til transport, og gi plagget luft når det lagres over lengre tid.'
            ]
          }
        ]
      }
    ]
  },
  'utekos-mikrofiber': {
    description: {
      title: 'Utekos Mikrofiber™',
      lead: 'Opplev definisjonen av uanstrengt varme.',
      blocks: [
        {
          paragraphs: [
            'Utekos Mikrofiber™ er vår letteste signaturmodell, konstruert for deg som verdsetter friheten i lav vekt kombinert med robust beskyttelse. Fiberisolasjonen tørker raskt og varmer selv i fuktig klima, mens det flammehemmende ytterstoffet tåler bruk rundt bålpannen.'
          ]
        },
        {
          title: '3-i-1-funksjonalitet',
          paragraphs: [
            'Kjernen er den originale 3-i-1-funksjonaliteten som lar deg tilpasse opplevelsen sømløst: fulldekket modus for total isolasjon, oppfestet modus for mobilitet eller parkasmodus for varig bevegelsesfrihet.'
          ]
        },
        {
          title: 'YKK® Dual V-Zip™',
          paragraphs: [
            'Det V-formede midtpartiet fungerer som en portal til innsiden. Gjennom to parallelle spor får du enkel tilgang til det innvendige heisesystemet, slik at du kan trekke opp lengden og låse den i parkasmodus uten å eksponere deg for kulden.'
          ]
        },
        {
          paragraphs: [
            'Dette er en alltid tilgjengelig ressurs som tar minimal plass, men leverer maksimal komfort. En investering i forutsigbar varme og friheten til å forlenge øyeblikket.'
          ]
        }
      ]
    },
    accordion: [
      {
        id: 'materialer',
        title: 'Materialer',
        groups: [
          {
            rows: [
              { label: 'Fôrstoff', value: 'Taffeta' },
              { label: 'Skallstoff', value: 'DuraLite™ Nylon' },
              {
                label: 'Belegg',
                value:
                  'Durable Water Repellent, inkl. flammehemming'
              },
              { label: 'Trådtetthet', value: '380T' },
              { label: 'Trådtykkelse', value: '20D' },
              { label: 'Vekt', value: 'Ca. 800 g' },
              { label: 'Glidelåser', value: 'YKK®' }
            ]
          }
        ]
      },
      {
        id: 'funksjoner',
        title: 'Funksjoner',
        groups: [
          {
            title: '3-i-1-funksjonalitet',
            items: [
              'Modulært system for sømløs tilpasning.',
              'Veksle mellom parkas, oppfestet modus for mobilitet eller fulldekket modus for maksimal isolasjon og kokongfølelse.'
            ]
          },
          {
            title: 'DuraLite™ Nylon (DWR)',
            items: [
              'Robust lettvektsmateriale i 20D/380T.',
              'Utviklet for nordisk natur, med vindtett, sterkt vannavvisende og pustende ytelse.'
            ]
          },
          {
            title: 'YKK® Dual V-Zip™',
            items: [
              'To-spors glidelåssystem med omvendt V-profil.',
              'Gir tilgang til innvendig justering og effektiv ventilasjon uten at frontpartiet må åpnes helt.'
            ]
          },
          {
            title: 'Isolert og justerbar hette',
            items: [
              'Romslig konstruksjon med god isolasjon og plass til lue eller ekstra bekledning.'
            ]
          },
          {
            title: 'Elastiske mansjetter',
            items: [
              'Myke Spandex-mansjetter som hindrer varmetap og kald trekk.'
            ]
          },
          {
            title: 'Lommer og varmemuffe',
            items: [
              'Dype sidelommer og sentrert, fôret muffe som fungerer som effektiv håndvarmer.'
            ]
          },
          {
            title: 'Transportsekk',
            items: [
              'Leveres med praktisk oppbevaringssekk for enkel transport og komprimering.'
            ]
          }
        ]
      },
      {
        id: 'egenskaper',
        title: 'Egenskaper',
        groups: [
          {
            title: 'Håndterer fuktige forhold',
            items: [
              'Syntetisk isolasjon konstruert for fuktige og ustabile forhold.',
              'Beholder isolerende evne når den blir våt og tørker raskt.'
            ]
          },
          {
            title: 'Lett, praktisk og vedlikeholdsfri',
            paragraphs: [
              'En lettvekter som enkelt pakkes i medfølgende sekk eller i Utekos Stapper™. Tar liten plass og er alltid klar for neste opplevelse ute.'
            ]
          },
          {
            title: 'Allergivennlig',
            paragraphs: [
              'Et vegansk valg for deg med dunallergi eller for deg som foretrekker produkter uten animalske materialer.'
            ]
          },
          {
            title: 'Robust og allsidig',
            paragraphs: [
              'Bygget for alt fra gnister fra bålpannen til våte høstturer. Lav vekt gjør den særlig egnet når komfort skal kombineres med aktivitet.'
            ]
          },
          {
            title: 'Ubegrenset bevegelsesfrihet',
            paragraphs: [
              'Romslig unisex-passform gir frihet til å bevege deg og plass til ekstra lag under.'
            ]
          }
        ]
      },
      {
        id: 'bruksomrader',
        title: 'Bruksområder',
        groups: [
          {
            title: 'Båt- og hytteliv',
            items: [
              'Camping, båt og bobilliv',
              'På hytten eller terrassen hjemme'
            ]
          },
          {
            title: 'Jakt og fiske',
            items: [
              'Smygjakt og posteringsjakt',
              'Fiske, inkludert isfiske'
            ]
          },
          {
            title: 'Pause og bålkos',
            items: [
              'Aktiv vandring, toppturer og skiturer',
              'Isklatring og krevende fjellsport'
            ]
          },
          {
            title: 'Til vanns',
            items: ['Båt- og seiltur', 'Isbading før og etter']
          },
          {
            title: 'Andre bruksområder',
            items: ['Kalde tribuner', 'Fotooppdrag i kulden']
          }
        ]
      },
      {
        id: 'passform',
        title: 'Passform',
        groups: [
          {
            title: 'Rom for bevegelse og ekstra lag',
            paragraphs: [
              'Utekos Mikrofiber™ er designet med sjenerøs passform som gir full bevegelsesfrihet og gjør det enkelt å ha flere lag under.'
            ]
          },
          {
            title: 'Fra parkas til full tildekking',
            paragraphs: [
              'Smarte snorstramminger justerer passformen fra luftig parkas til tett og varmende kokong.'
            ]
          },
          {
            title: 'Finn din perfekte match',
            paragraphs: [
              'Bruk lenken ved størrelsesvelgeren og i menyen over for å se de nøyaktige målene.'
            ]
          }
        ]
      },
      {
        id: 'vaskeanvisning',
        title: 'Vaskeanvisning',
        groups: [
          {
            items: [
              'Maskinvask på maks 30°C.',
              'Bruk mild såpe.',
              'Unngå tørketrommel. La plagget lufttørke.',
              'Unngå stryking og bleking.'
            ],
            note: {
              title: 'Viktig',
              text: 'Oppbevares tørt. Sørg for at plagget tørkes godt etter bruk i fuktige omgivelser. For lengre lagring anbefales ukomprimert oppbevaring for å bevare loft og form.'
            }
          }
        ]
      }
    ]
  },
  'utekos-dun': {
    description: {
      title: 'Utekos Dun™',
      lead: 'Opplev en ny standard for varme og komfort i friluftsgarderoben.',
      blocks: [
        {
          paragraphs: [
            'Utekos Dun™ omslutter deg med luksuriøs dunisolasjon med over 90 % kvalitetsdun, beskyttet av et slitesterkt nylonytterlag. Med vannavvisende og flammehemmende DWR-behandlet stoff kan du forlenge kvelden ute med trygg komfort.'
          ]
        },
        {
          paragraphs: [
            'Plagget kombinerer elegant sovepose og jakke i ett. Den romslige passformen gir full bevegelsesfrihet, enten du brygger morgenkaffe ved bobilen eller koser deg på hytteterrassen.'
          ]
        },
        {
          paragraphs: [
            'Justerbar hette og toveis glidelås gjør at du tilpasser Utekos Dun™ etter behov. Snør den igjen rundt beina for maksimal varme, eller åpne nederst for ventilasjon når du beveger deg.'
          ]
        },
        {
          paragraphs: [
            'Fra vinterfjellet til kjølige sommerkvelder leverer Utekos Dun™ en kombinasjon av varme, komfort og mobilitet for deg som vil nyte livet utendørs.'
          ]
        }
      ]
    },
    accordion: [
      {
        id: 'materialer',
        title: 'Materialer',
        groups: [
          {
            rows: [
              {
                label: 'Fôrstoff',
                value: 'Premium 90 % Taffeta Dun'
              },
              {
                label: 'Skallstoff',
                value: 'Downproof nylon taft med DWR'
              },
              {
                label: 'Belegg',
                value:
                  'Durable Water Repellent, inkl. flammehemming'
              },
              { label: 'Trådtetthet', value: '380T' },
              { label: 'Trådtykkelse', value: '20D' },
              { label: 'Fyll', value: '400 g' },
              { label: 'Vekt', value: 'Ca. 1000 g' },
              {
                label: 'Glidelåser',
                value: 'YKK toveis glidelås'
              }
            ]
          }
        ]
      },
      {
        id: 'funksjoner',
        title: 'Funksjoner',
        groups: [
          {
            title: '3-i-1-funksjonalitet',
            paragraphs: [
              'Lar deg justere passformen etter brukssituasjonen. Bruk den som parkas, i oppfestet modus eller med full tildekking av kropp og føtter for maksimal varme.'
            ]
          },
          {
            title: 'Premium isolasjon',
            paragraphs: [
              'Fylt med 90 % kvalitetsdun med 650 FP fyllkraft.'
            ]
          },
          {
            title: 'Slitesterkt ytterstoff',
            paragraphs: [
              'DWR-behandlet og flammehemmende 20D Nylon Taffeta.'
            ]
          },
          {
            title: 'Toveis YKK®-glidelås',
            paragraphs: [
              'Kan åpnes både ovenfra og nedenfra, noe som gir kontroll på ventilasjon og bevegelsesfrihet.'
            ]
          },
          {
            title: 'Isolert og justerbar hette',
            paragraphs: [
              'Gir beskyttelse og plass til et godt lag med ull under uten å føles trang.'
            ]
          },
          {
            title: 'Myke stretch-mansjetter',
            paragraphs: [
              'Elastiske mansjetter forsegler varmen inne og holder kald trekk ute.'
            ]
          },
          {
            title: 'Håndlommer og muffe',
            paragraphs: [
              'Praktiske sidelommer og behagelig muffe varmer hendene raskt.'
            ]
          },
          {
            title: 'Medfølgende sekk',
            paragraphs: [
              'Leveres med praktisk sekk for pakking og oppbevaring.'
            ]
          }
        ]
      },
      {
        id: 'egenskaper',
        title: 'Egenskaper',
        groups: [
          {
            title: 'Både varm og lett',
            paragraphs: [
              'Høyt varme-til-vekt-forhold gir maksimal isolasjon med minimal vekt og pakkvolum.'
            ]
          },
          {
            title: 'Vær- og vindbestandig',
            paragraphs: [
              'Tettvevd ytterstoff på 380T beskytter mot vær og vind, samtidig som plagget puster.'
            ]
          },
          {
            title: 'Vannavvisende og robust',
            paragraphs: [
              'DWR-behandlingen holder deg tørr i lett regn, mens flammehemmende materiale gir ekstra trygghet rundt bålpannen.'
            ]
          },
          {
            title: 'Bygget for norske forhold',
            paragraphs: [
              'Designet for alt fra kalde fjelldaler til fuktige kystkvelder.'
            ]
          },
          {
            title: 'Allsidig i bruk',
            paragraphs: [
              'Egnet som restitusjonsplagg etter topptur og som komfortplagg til hytteliv.'
            ]
          },
          {
            title: 'Ubegrenset bevegelsesfrihet',
            paragraphs: [
              'Romslig unisex-passform gir frihet til å bevege deg og plass til ekstra lag.'
            ]
          }
        ]
      },
      {
        id: 'bruksomrader',
        title: 'Bruksområder',
        groups: [
          {
            title: 'Leir- og hytteliv',
            items: [
              'Camping, bobil og hengekøye',
              'På hytten og terrassen'
            ]
          },
          {
            title: 'Jakt og fiske',
            items: [
              'Smygjakt og posteringsjakt',
              'Fiske, inkludert isfiske'
            ]
          },
          {
            title: 'Fjellsport og turer',
            items: [
              'Pause og bålkos',
              'Aktiv vandring, toppturer og skiturer',
              'Isklatring og krevende fjellsport'
            ]
          },
          {
            title: 'Til vanns',
            items: ['Båt- og seiltur', 'Isbading før og etter']
          },
          {
            title: 'Andre bruksområder',
            items: ['Kalde tribuner', 'Fotooppdrag i kulden']
          }
        ]
      },
      {
        id: 'passform',
        title: 'Passform',
        groups: [
          {
            title: 'Romslig og funksjonell passform',
            paragraphs: [
              'Utekos Dun™ er designet for stor bevegelsesfrihet, enten du er på tur eller slapper av på hytten, i båten eller rundt bobilen. Snittet er sjenerøst og gir plass til ekstra kleslag.'
            ]
          },
          {
            title: 'Tilpasset beskyttelse mot været',
            paragraphs: [
              'Praktiske justeringsmuligheter og stretch-mansjetter gjør det enkelt å stenge ute kald vind og ruskevær.'
            ]
          },
          {
            title: 'Finn din perfekte match',
            paragraphs: [
              'Bruk lenken ved størrelsesvelgeren og i menyen over for å se de nøyaktige målene.'
            ]
          }
        ]
      },
      {
        id: 'vaskeanvisning',
        title: 'Vaskeanvisning',
        groups: [
          {
            title: 'Maskinvask på maks 30°C',
            paragraphs: [
              'Bruk mild såpe, gjerne spesialsåpe for dunprodukter. Sjekk produktets etikett for nøyaktig anbefaling.'
            ]
          },
          {
            title: 'Unngå tørketrommelen',
            paragraphs: [
              'Dun krever spesiell tørking, ofte med tørkeballer, for å gjenopprette spenst og luftighet. Følg instruksjonene for dunprodukter nøye.'
            ]
          },
          {
            note: {
              title: 'Viktig',
              text: 'Oppbevares tørt og ikke komprimert over lengre tid. Tørk alltid fullstendig etter bruk i fuktige omgivelser. Unngå stryking og bleking.'
            }
          }
        ]
      }
    ]
  },
  'comfyrobe': {
    description: {
      title: 'Comfyrobe™',
      lead: 'Tøff mot været. Komfortabel for deg.',
      blocks: [
        {
          paragraphs: [
            'Comfyrobe™ er den ultimate roben for deg som ønsker en kombinasjon av teknisk ytelse, kompromissløs komfort og tidløst design.'
          ]
        },
        {
          paragraphs: [
            'Det slitesterke ytterstoffet i HydroGuard™ er både vanntett og vindtett. Pustende egenskaper transporterer overskuddsfuktighet bort fra kroppen slik at du unngår klamhet.'
          ]
        },
        {
          paragraphs: [
            'På innsiden finner du SherpaCore™, et tykt teknisk fôr av syntetisk lammeull som omslutter kroppen med varme. Materialet absorberer effektivt fuktighet og holder deg komfortabel etter aktivitet eller eksponering for kulde.'
          ]
        },
        {
          title: 'Gjennomtenkte detaljer',
          items: [
            'Solid toveis YKK®-glidelås for enkel temperaturregulering.',
            'Fôrede ytterlommer med høy komfort.',
            'Romslig hette som beskytter mot vind og kulde.',
            'Splitt bak for optimal bevegelsesfrihet.',
            'Rent og stilfullt design som passer både i naturen og i byen.'
          ]
        },
        {
          paragraphs: [
            'Enten du sitter i båten på en kjølig kveld, slapper av på campingen eller nyter morgenkaffen utendørs, gjør Comfyrobe™ opplevelsen varmere og mer behagelig.'
          ]
        }
      ]
    },
    accordion: [
      {
        id: 'materialer',
        title: 'Materialer',
        groups: [
          {
            paragraphs: [
              'Skallet består av et høytpresterende HydroGuard™ Shell (130 GSM i 100 % polyester) laminert med en pustende PU-membran. Med en vannsøyle på 8 000 mm gir dette fullstendig beskyttelse mot kraftig regn og vind. Samtidig sørger membranen (3 000 g/m²/24t) for å effektivt slippe ut overskuddsvarme.',
              'Innsiden er fôret med 250 GSM SherpaCore™, en myk og lun syntetisk lammeullsfleece av høy kvalitet. Fleecen er antipeeling-behandlet for å sikre varig mykhet og slitestyrke. Konstruksjonen gir umiddelbar varme rundt kroppens vitale soner og absorberer restfuktighet direkte fra huden.',
              'Utstyrt med robuste YKK®-glidelåser av høy kvalitet som sikrer smidig bruk og lang levetid, uansett værforhold.'
            ]
          }
        ]
      },
      {
        id: 'funksjoner',
        title: 'Funksjoner',
        groups: [
          {
            title: 'Romslig og justerbar hette',
            paragraphs: [
              'En stor hette som enkelt kan strammes og tilpasses for å gi maksimal beskyttelse når været snur.'
            ]
          },
          {
            title: 'Toveis glidelås midt foran',
            paragraphs: [
              'Den praktiske toveis glidelåsen gjør av- og påkledningen rask og smidig, og lar deg enkelt lufte ut eller åpne opp nedenfra for ekstra bevegelighet.'
            ]
          },
          {
            title: 'Lommedetaljer',
            paragraphs: [
              'Utstyrt med to fôrede sidelommer som raskt varmer opp kalde hender, samt en sikker innerlomme for trygg oppbevaring av telefon og verdisaker.'
            ]
          },
          {
            title: 'Justerbare ermekanter',
            paragraphs: [
              'Ermene har en forhøyet stropp med borrelås som gjør det enkelt å stramme mansjettene for å stenge kulden ute, eller løsne dem for økt ventilasjon.'
            ]
          },
          {
            title: 'Økt synlighet',
            paragraphs: [
              'Integrerte, diskrete refleksdetaljer sørger for at du er mer synlig under mørke og grå forhold, uten at det går på bekostning av det rene designet.'
            ]
          }
        ]
      },
      {
        id: 'egenskaper',
        title: 'Egenskaper',
        groups: [
          {
            rows: [
              {
                label: '8 000 mm vannsøyle',
                value: 'Beskytter når regnet varer.'
              },
              {
                label: 'Pustende membran',
                value: 'Slipper ut overskuddsvarme.'
              }
            ]
          },
          {
            title: 'Bredt bruksområde i all slags vær',
            items: [
              'Egnet som varmeplagg etter isbad, som beskyttende lag på terrassen eller som skalljakke i hverdagen.',
              'Perfekt for camping, bobil, kalde tribuner og som et trygt valg i garderoben.',
              'Ryddig og stilfullt uttrykk gjør den anvendelig til mange ærend.'
            ]
          }
        ]
      },
      {
        id: 'passform',
        title: 'Passform',
        groups: [
          {
            paragraphs: [
              'Comfyrobe™ er designet med en uformell og romslig unisex-passform. Den ekstra vidden er nøye uttenkt for at du enkelt skal kunne trekke jakken rett over vått tøy, våtdrakter eller tykke ullgensere. For å balansere det romslige volumet med funksjonalitet, er jakken utstyrt med strategiske splitter både bak og i sidene, noe som sikrer optimal bevegelsesfrihet gjennom hele dagen.'
            ]
          }
        ]
      },
      {
        id: 'vaskeanvisning',
        title: 'Vaskeanvisning',
        groups: [
          {
            title: 'Maskinvask på maks 40°C',
            items: [
              'Skånsomt program.',
              'Bruk mildt vaskemiddel.',
              'Ikke bruk blekemiddel.'
            ]
          },
          {
            title: 'Unngå tørketrommelen',
            items: [
              'Unngå tørketrommel for å bevare vanntettheten lengst mulig.',
              'Om nødvendig kan den tromles kort på lav temperatur for å fluffe opp fôret.',
              'Ytterstoffet må ikke utsettes for høy varme.',
              'Ideelt tørkes plagget hengende.',
              'Etterbehandle det vannavvisende laget med egnet spray eller impregnering ved behov.'
            ]
          },
          {
            title: 'Daglig vedlikehold',
            items: ['Heng gjerne til lufting etter bruk.']
          }
        ]
      }
    ]
  },
  'utekos-stapper': {
    description: {
      title: 'Utekos Stapper™',
      lead: 'Maksimal plassbesparelse.',
      blocks: [
        {
          paragraphs: [
            'Utekos Stapper™ reduserer volumet på soveposer, jakker og klær med over 50 %, slik at du får plass til mer i sekken eller bagasjen.'
          ]
        },
        {
          items: [
            'Slitesterkt materiale konstruert for hard stramming og røff behandling på tur.',
            'Ultralett design på ca. 100 gram, perfekt for fotturer og reiser.',
            'Fire justerbare strammestropper komprimerer innholdet jevnt og effektivt.'
          ]
        }
      ]
    }
  }
} as const satisfies Record<
  ProductPageHandle,
  ProductPageContent
>

export function getProductPageContent(
  handle: string | null | undefined
): ProductPageContent | undefined {
  if (!handle) return undefined

  return PRODUCT_PAGE_CONTENT[handle as ProductPageHandle]
}

export function getProductPageDescriptionText(
  handle: string | null | undefined
): string | undefined {
  const content = getProductPageContent(handle)

  if (!content) return undefined

  const blockText = content.description.blocks
    .flatMap(block => [
      block.title,
      ...(block.paragraphs ?? []),
      ...(block.items ?? [])
    ])
    .filter((value): value is string => Boolean(value))
    .join(' ')

  return [content.description.lead, blockText]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}
