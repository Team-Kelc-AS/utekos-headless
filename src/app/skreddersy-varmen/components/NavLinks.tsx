import type { NavLink } from '@types'
import { Home, Layers, Ruler, BookOpen } from 'lucide-react'
import type { Route } from 'next'
import { BoxOutlineIcon, LocationIcon, MerchantTruckIcon } from '@/components/utekos-icons'
export const NavLinks: NavLink[] = [
  {
    label: 'Forsiden',
    href: '/' as Route,
    icon: <Home className='w-6 h-6' />,
    description: 'Hjem | Utekos.no'
  },
  {
    label: 'Se alle produkter',
    href: '/produkter' as Route,
    icon: <BoxOutlineIcon tone="orange" className='w-6 h-6' />,
    description: 'Utforsk kolleksjonen'
  },
  {
    label: 'Teknologi og materialer',
    href: '/handlehjelp/teknologi-materialer' as Route,
    icon: <Layers className='w-6 h-6' />,
    description: 'Hvorfor det virker'
  },
  {
    label: 'Vår historie',
    href: '/om-oss' as Route,
    icon: <LocationIcon tone="orange" className='w-6 h-6' />,
    description: 'Om Utekos'
  },
  {
    label: 'Frakt og retur',
    href: '/frakt-og-retur' as Route,
    icon: <MerchantTruckIcon tone="orange" className='w-6 h-6' />,
    description: 'Trygg handel'
  },
  {
    label: 'Størrelseguide',
    href: '/handlehjelp/storrelsesguide' as Route,
    icon: <Ruler className='w-6 h-6' />,
    description: 'Finn din størrelse'
  },
  {
    label: 'Magasinet',
    href: '/magasinet' as Route,
    icon: <BookOpen className='w-6 h-6' />,
    description: 'Inspirasjon og historier',
    mdOnly: true
  }
]
