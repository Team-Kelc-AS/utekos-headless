import { Maximize2, Move, User } from 'lucide-react'
import TechHalfImage from '@/assets/images/techdown/utekos-techdown-halvfigur-forfra-1600x1600.webp'
import TechDownKateKikkertImage from '@/assets/images/techdown/TechDown-Kikkert-1600x1600.webp'
import TechDownFullLengthMobileImage from '@/assets/images/techdown/TechDown-1080x1350-2.webp'
import TechDownFullLengthDesktopImage from '@/assets/images/techdown/TechDown-1200x1200-4.webp'

export const Steps = [
  {
    id: 'fullengde',
    stepNumber: '01',
    modeName: 'Fullengdemodus',
    title: 'Maksimal isolasjon',
    description:
      'Utgangspunktet for selve utekosen. Pakk deg inn i en isolerende kokong for komplett komfort. Perfekt i hytteveggen, utenfor bobilen eller lange kvelder på terrassen hvor roen senker seg.',
    icon: <Maximize2 className='size-5' />,
    image: {
      mobile: TechDownFullLengthMobileImage,
      desktop: TechDownFullLengthDesktopImage
    },
    mobileAspectClassName: 'aspect-[4/5]',
    isProduct: false,
    desktopObjectFit: 'cover',
    desktopObjectPosition: 'center center'
  },
  {
    id: 'oppjustert',
    stepNumber: '02',
    modeName: 'Oppjustert modus',
    title: 'Umiddelbar mobilitet',
    description:
      'Nyter du total omfavnelse av Utekos, men må plutselig på kjøkkenet eller svare telefonen? Heis opp plagget til ønsket lengde, stram snoren i livet og bli mobil på sekunder. Beveg deg trygt og subbefritt – uten å miste varmen.',
    icon: <Move className='size-5' />,
    image: {
      mobile: TechHalfImage,
      desktop: TechHalfImage
    },
    mobileAspectClassName: 'aspect-square',
    isProduct: true,
    desktopObjectFit: 'contain',
    desktopObjectPosition: 'center center'
  },
  {
    id: 'parkas',
    stepNumber: '03',
    modeName: 'Parkasmodus',
    title: 'Selvformet eleganse',
    description:
      'Planlagt bevegelse over tid. Forvandle Utekos til en selvformet parkas. Full bevegelsesfrihet med et elegant snitt.',
    icon: <User className='size-5' />,
    image: {
      mobile: TechDownKateKikkertImage,
      desktop: TechDownKateKikkertImage
    },
    mobileAspectClassName: 'aspect-square',
    isProduct: false,
    desktopObjectFit: 'cover',
    desktopObjectPosition: 'center center'
  }
]
