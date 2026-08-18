import { PINTEREST_CATALOG_FEED_URL } from './pinterestCatalogFeedUrl'

export const PINTEREST_CATALOG_TYPE = 'RETAIL' as const
export const PINTEREST_CATALOG_NAME = 'Utekos Retail Catalog'
export const PINTEREST_FEED_NAME =
  'Utekos Pinterest Catalog Feed'
export const PINTEREST_FEED_FORMAT = 'TSV' as const
export const PINTEREST_FEED_COUNTRY = 'NO' as const
export const PINTEREST_FEED_CURRENCY = 'NOK' as const
export const PINTEREST_FEED_LOCALE = 'nb-NO' as const
export const PINTEREST_FEED_SIZE_SYSTEM = 'EU' as const
export const PINTEREST_FEED_TIMEZONE = 'Europe/Oslo' as const
export const PINTEREST_FEED_PROCESSING_TIME = '02:00' as const

export const PINTEREST_CATALOG_CREATE_REQUEST = {
  name: PINTEREST_CATALOG_NAME,
  catalog_type: PINTEREST_CATALOG_TYPE
} as const

export const PINTEREST_FEED_CREATE_REQUEST = {
  name: PINTEREST_FEED_NAME,
  catalog_type: PINTEREST_CATALOG_TYPE,
  format: PINTEREST_FEED_FORMAT,
  default_country: PINTEREST_FEED_COUNTRY,
  default_currency: PINTEREST_FEED_CURRENCY,
  default_locale: PINTEREST_FEED_LOCALE,
  location: PINTEREST_CATALOG_FEED_URL,
  preferred_processing_schedule: {
    time: PINTEREST_FEED_PROCESSING_TIME,
    timezone: PINTEREST_FEED_TIMEZONE
  }
} as const
