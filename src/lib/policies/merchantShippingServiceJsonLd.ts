export const MERCHANT_SHIPPING_SERVICE_ID =
  'https://utekos.no/#shipping-service-no' as const

type ShippingConditionsJsonLd = {
  '@type': 'ShippingConditions'
  shippingDestination: {
    '@type': 'DefinedRegion'
    addressCountry: 'NO'
  }
  orderValue: {
    '@type': 'MonetaryAmount'
    currency: 'NOK'
    minValue: number
    maxValue?: number
  }
  shippingRate: {
    '@type': 'MonetaryAmount'
    value: number
    currency: 'NOK'
  }
  transitTime: {
    '@type': 'ServicePeriod'
    businessDays: ReadonlyArray<
      | 'https://schema.org/Monday'
      | 'https://schema.org/Tuesday'
      | 'https://schema.org/Wednesday'
      | 'https://schema.org/Thursday'
      | 'https://schema.org/Friday'
    >
    duration: {
      '@type': 'QuantitativeValue'
      minValue: 2
      maxValue: 5
      unitCode: 'DAY'
    }
  }
}

export type MerchantShippingServiceJsonLd = {
  '@type': 'ShippingService'
  '@id': typeof MERCHANT_SHIPPING_SERVICE_ID
  name: string
  shippingConditions: [
    ShippingConditionsJsonLd,
    ShippingConditionsJsonLd
  ]
}

const norwegianTransitTime = {
  '@type': 'ServicePeriod',
  'businessDays': [
    'https://schema.org/Monday',
    'https://schema.org/Tuesday',
    'https://schema.org/Wednesday',
    'https://schema.org/Thursday',
    'https://schema.org/Friday'
  ],
  'duration': {
    '@type': 'QuantitativeValue',
    'minValue': 2,
    'maxValue': 5,
    'unitCode': 'DAY'
  }
} as const

export const merchantShippingServiceJsonLd = {
  '@type': 'ShippingService',
  '@id': MERCHANT_SHIPPING_SERVICE_ID,
  'name': 'Utekos standardfrakt i Norge',
  'shippingConditions': [
    {
      '@type': 'ShippingConditions',
      'shippingDestination': {
        '@type': 'DefinedRegion',
        'addressCountry': 'NO'
      },
      'orderValue': {
        '@type': 'MonetaryAmount',
        'currency': 'NOK',
        'minValue': 0,
        'maxValue': 998.99
      },
      'shippingRate': {
        '@type': 'MonetaryAmount',
        'value': 99,
        'currency': 'NOK'
      },
      'transitTime': norwegianTransitTime
    },
    {
      '@type': 'ShippingConditions',
      'shippingDestination': {
        '@type': 'DefinedRegion',
        'addressCountry': 'NO'
      },
      'orderValue': {
        '@type': 'MonetaryAmount',
        'currency': 'NOK',
        'minValue': 999
      },
      'shippingRate': {
        '@type': 'MonetaryAmount',
        'value': 0,
        'currency': 'NOK'
      },
      'transitTime': norwegianTransitTime
    }
  ]
} as const satisfies MerchantShippingServiceJsonLd
