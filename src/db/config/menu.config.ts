// Path: src/db/config/menu.config.ts
import type { MenuItem } from '@types'

export const mainMenu: MenuItem[] = [
  {
    title: 'Handle nå',
    url: '/produkter',
    items: [
      {
        title: 'Utekos Mikrofiber™',
        url: '/produkter/utekos-mikrofiber',
        items: []
      },
      { title: 'Utekos Dun™', url: '/produkter/utekos-dun', items: [] },
      { title: 'Comfyrobe™', url: '/produkter/comfyrobe', items: [] },
      {
        title: 'Utekos TechDown™',
        url: '/produkter/utekos-techdown',
        items: []
      },
      {
        title: 'Utekos Stapper™',
        url: '/produkter/utekos-stapper',
        items: []
      },
      { title: 'Se alle produkter', url: '/produkter', items: [] }
    ]
  },
  {
    title: 'Om Utekos',
    url: '/om-oss',
    items: [
      { title: 'Om Utekos', url: '/om-oss', items: [] },
      { title: 'Kontakt oss', url: '/kontaktskjema', items: [] }
    ]
  },
  {
    title: 'Uteguiden',
    url: '/uteguiden',
    items: []
  },
  {
    title: 'Magasinet',
    url: '/magasinet',
    items: []
  }
]
