import { Mountain, Route, TreePine, Waves } from 'lucide-react'
import type { Destination } from '../types'

export const destinationsData: Destination[] = [
  {
    icon: Mountain,
    name: 'Lofoten',
    season: 'Sommer/Høst',
    highlight: 'Midnattssol og nordlys'
  },
  {
    icon: Waves,
    name: 'Geirangerfjorden',
    season: 'Vår/Sommer',
    highlight: 'Spektakulære fjorder'
  },
  {
    icon: TreePine,
    name: 'Hardangervidda',
    season: 'Hele året',
    highlight: 'Viddelandskap og stillhet'
  },
  {
    icon: Route,
    name: 'Atlanterhavsveien',
    season: 'Sommer/Høst',
    highlight: 'Dramatisk kystlinje'
  }
]
