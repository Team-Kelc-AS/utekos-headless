import comfyrobeMobile002 from '@/assets/images/comfyrobe/Comfyrobe-Mobile-002.webp'
import comfyrobeMobile003 from '@/assets/images/comfyrobe/Comfyrobe-Mobile-003.webp'
import comfyrobeMobile004 from '@/assets/images/comfyrobe/Comfyrobe-Mobile-004.webp'
import comfyrobeDesktop002 from '@/assets/images/comfyrobe/Comfyrobe-002.webp'
import comfyrobeSherpa from '@/assets/images/comfyrobe/Sherpa.webp'
import mikrofiberMedium from '@/assets/images/mikrofiber/12.webp'
import mikrofiberLarge from '@/assets/images/mikrofiber/11.webp'

export const HELP_CHOOSE_GLOW = '#012622'

export type HelpChooseCarouselDefinition = {
  id: 'svale' | 'techdown' | 'dun' | 'mikrofiber' | 'comfyrobe'
  handle: string
  label: string
  itemListId: string
  itemListName: string
  action: 'purchase' | 'waitlist'
  preferredColor: string | null
  includeHiddenSizes: boolean
  cards: readonly {
    size: string
    color?: string
    label?: string
    imageSrc?: string
  }[]
}

type HelpChooseCardImage = { src: string; alt: string }

export const HELP_CHOOSE_CAROUSELS = [
  {
    id: 'svale',
    handle: 'utekos-svale',
    label: 'Utekos Svale',
    itemListId: 'help_choose_svale',
    itemListName: 'Utekos Svale',
    action: 'purchase',
    preferredColor: null,
    includeHiddenSizes: false,
    cards: [
      { size: 'Middels', imageSrc: '/Svale_1.webp' },
      { size: 'Stor', imageSrc: '/Svale_2.webp' },
      { size: 'Større', imageSrc: '/Svale_3.webp' }
    ]
  },
  {
    id: 'techdown',
    handle: 'utekos-techdown',
    label: 'Utekos TechDown™',
    itemListId: 'help_choose_techdown',
    itemListName: 'Utekos TechDown™',
    action: 'purchase',
    preferredColor: 'Havdyp',
    includeHiddenSizes: true,
    cards: [
      { size: 'Stor' },
      { size: 'Større' },
      { size: 'Middels' },
      { size: 'Liten' }
    ]
  },
  {
    id: 'dun',
    handle: 'utekos-dun',
    label: 'Utekos Dun™',
    itemListId: 'help_choose_dun',
    itemListName: 'Utekos Dun™',
    action: 'purchase',
    preferredColor: 'Fjellblå',
    includeHiddenSizes: false,
    cards: [
      {
        size: 'Medium',
        color: 'Vargnatt',
        label: 'Vargnatt M',
        imageSrc: '/Soveposejakke_Black_1.webp'
      },
      {
        size: 'Large',
        color: 'Vargnatt',
        label: 'Vargnatt L',
        imageSrc: '/Mikrfofiber_1000x1500_Back_Black.webp'
      },
      {
        size: 'Medium',
        color: 'Fjellblå',
        label: 'Fjellblå M',
        imageSrc: '/Mikro_1000x1500_Bakside.webp'
      },
      {
        size: 'Large',
        color: 'Fjellblå',
        label: 'Fjellblå L',
        imageSrc: '/Mikro_1000x1500_Diagonal.webp'
      }
    ]
  },
  {
    id: 'mikrofiber',
    handle: 'utekos-mikrofiber',
    label: 'Utekos Mikrofiber™',
    itemListId: 'help_choose_mikrofiber',
    itemListName: 'Utekos Mikrofiber™',
    action: 'purchase',
    preferredColor: 'Fjellblå',
    includeHiddenSizes: false,
    cards: [
      {
        size: 'Medium',
        color: 'Fjellblå',
        label: 'Fjellblå M',
        imageSrc: '/Mikro_1000x1500_Front.webp'
      },
      {
        size: 'Large',
        color: 'Fjellblå',
        label: 'Fjellblå L',
        imageSrc: '/Mikro_1000x1500_Diagonal.webp'
      },
      {
        size: 'Medium',
        color: 'Vargnatt',
        label: 'Vargnatt M',
        imageSrc: '/Soveposejakke_Black_3.webp'
      },
      {
        size: 'Large',
        color: 'Vargnatt',
        label: 'Vargnatt L',
        imageSrc: '/Soveposejakke_Black_4.webp'
      }
    ]
  },
  {
    id: 'comfyrobe',
    handle: 'comfyrobe',
    label: 'Comfyrobe™',
    itemListId: 'help_choose_comfyrobe',
    itemListName: 'Comfyrobe™',
    action: 'purchase',
    preferredColor: 'Fjellnatt',
    includeHiddenSizes: false,
    cards: [
      {
        size: 'XS',
        label: 'S/XS',
        imageSrc: '/Comfy_1000x1500_1.webp'
      },
      {
        size: 'M',
        label: 'M/L',
        imageSrc: '/Comfy_1000x1500_Fly.webp'
      },
      {
        size: 'XL',
        label: 'L/XXL',
        imageSrc: '/Comfy_1000x1500_Open.webp'
      }
    ]
  }
] as const satisfies readonly HelpChooseCarouselDefinition[]

const CARD_IMAGES: Record<
  string,
  Record<string, HelpChooseCardImage>
> = {
  'utekos-techdown': {
    Stor: {
      src: '/TechDown_2000x3000_2.webp',
      alt: 'Utekos TechDown™ Stor i Havdyp.'
    },
    Større: {
      src: '/TechDown_2000x3000_8.webp',
      alt: 'Utekos TechDown™ Større i Havdyp.'
    },
    Middels: {
      src: '/TechDown_2000x3000_1.webp',
      alt: 'Utekos TechDown™ Middels i Havdyp.'
    },
    Liten: {
      src: '/TechDown-Liten.webp',
      alt: 'Utekos TechDown™ Liten i Havdyp.'
    }
  },
  'utekos-dun': {
    Medium: {
      src: 'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Utekos-Dun-Fjellbl_-Kvinne-Terrasse-1080x1350.png',
      alt: 'Utekos Dun™ Medium.'
    },
    Large: {
      src: 'https://cdn.shopify.com/s/files/1/0634/2154/6744/files/Dun-Fjellbla-Parkas-1080x1350.png',
      alt: 'Utekos Dun™ Large.'
    }
  },
  'utekos-mikrofiber': {
    Medium: {
      src: mikrofiberMedium.src,
      alt: 'Utekos Mikrofiber™ Medium.'
    },
    Large: {
      src: mikrofiberLarge.src,
      alt: 'Utekos Mikrofiber™ Large.'
    }
  },
  'comfyrobe': {
    'XS': {
      src: comfyrobeMobile002.src,
      alt: 'Comfyrobe™ i størrelsen XS.'
    },
    'S': {
      src: comfyrobeMobile003.src,
      alt: 'Comfyrobe™ i størrelsen S.'
    },
    'M': {
      src: comfyrobeMobile004.src,
      alt: 'Comfyrobe™ i størrelsen M.'
    },
    'L': {
      src: comfyrobeDesktop002.src,
      alt: 'Comfyrobe™ i størrelsen L.'
    },
    'XL': {
      src: comfyrobeSherpa.src,
      alt: 'Comfyrobe™ i størrelsen XL.'
    },
    'XS/S': {
      src: comfyrobeMobile002.src,
      alt: 'Comfyrobe™ i størrelsen XS/S.'
    },
    'ML/L': {
      src: comfyrobeMobile004.src,
      alt: 'Comfyrobe™ i størrelsen ML/L.'
    },
    'L/XL': {
      src: comfyrobeSherpa.src,
      alt: 'Comfyrobe™ i størrelsen L/XL.'
    }
  }
}

export function helpChooseCardImage(
  handle: string,
  sizeLabel: string,
  fallbackSrc: string | null | undefined,
  fallbackAlt: string
): HelpChooseCardImage | null {
  const curated = CARD_IMAGES[handle]?.[sizeLabel]
  if (curated) return curated
  if (!fallbackSrc) return null
  return { src: fallbackSrc, alt: fallbackAlt }
}
