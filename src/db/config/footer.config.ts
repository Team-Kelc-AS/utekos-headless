// Path: src/config/footer.config.ts
import type { Route } from 'next'
import type { FooterSection } from '@types'

export const footerConfig: FooterSection[] = [
  {
    title: 'Handlehjelp',
    links: [
      {
        title: 'Kontakt oss',
        path: '/kontaktskjema' as Route,
        trackingEvent: 'FooterContactClick'
      },
      {
        title: 'Teknologi og materialer',
        path: '/handlehjelp/teknologi-materialer' as Route,
        trackingEvent: 'FooterTechMaterialsClick'
      },
      {
        title: 'Vask og vedlikehold',
        path: '/handlehjelp/vask-og-vedlikehold' as Route,
        trackingEvent: 'FooterWashMaintenanceClick'
      },
      {
        title: 'Størrelses­guide',
        path: '/handlehjelp/storrelsesguide' as Route,
        trackingEvent: 'FooterSizeGuideClick'
      }
    ]
  },
  {
    title: 'Kundeservice',
    links: [
      {
        title: 'Kundeservice',
        path: '/kontaktskjema' as Route,
        trackingEvent: 'FooterCustomerServicePageClick'
      },
      {
        title: 'Tlf: +47 40 21 63 43',
        path: 'tel:+4740216343' as Route,
        external: true,
        trackingEvent: 'FooterPhoneClick'
      },
      {
        title: 'E-post: kundeservice@utekos.no',
        path: 'mailto:kundeservice@utekos.no' as Route,
        external: true,
        trackingEvent: 'FooterEmailClick'
      }
    ]
  },
  {
    title: 'Informasjon',
    links: [
      {
        title: 'Om oss',
        path: '/om-oss' as Route,
        trackingEvent: 'FooterAboutUsClick'
      },
      {
        title: 'Frakt og retur',
        path: '/frakt-og-retur' as Route,
        trackingEvent: 'FooterShippingReturnClick'
      },
      {
        title: 'Personvern',
        path: '/personvern' as Route,
        trackingEvent: 'FooterPrivacyClick'
      },
      {
        title: 'Vilkår og betingelser',
        path: '/vilkar-betingelser' as Route,
        trackingEvent: 'FooterTermsConditionsClick'
      }
    ]
  },
  {
    title: 'Bedriftsinformasjon',
    links: [
      {
        title: 'KELC AS',
        path: '/' as Route,
        trackingEvent: 'FooterKelcAsClick'
      },
      {
        title: 'Lille Damsgårdsveien 25',
        path: 'map:Lille Damsgårdsveien 25' as Route,
        external: true,
        trackingEvent: 'FooterAddressClick'
      },
      {
        title: '5162, Laksevåg',
        path: 'map:Lille Damsgårdsveien 25, 5162, Bergen' as Route,
        external: true,
        trackingEvent: 'FooterCityClick'
      },
      {
        title: 'Org.nr 925 820 393',
        path: '/kontaktskjema' as Route,
        trackingEvent: 'FooterOrgNrClick'
      }
    ]
  }
]
