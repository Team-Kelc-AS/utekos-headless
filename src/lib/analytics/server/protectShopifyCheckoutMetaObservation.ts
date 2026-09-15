import {
  ParamBuilder,
  PII_DATA_TYPE
} from 'capi-param-builder-nodejs'

import {
  shopifyCheckoutMetaObservationSchema,
  type ShopifyCheckoutMetaObservationInput
} from '../shopifyCheckoutObservationContract'

const piiBuilder = new ParamBuilder(['utekos.no'])

function hash(value: string | undefined, type: string) {
  if (!value) return undefined

  const protectedValue = piiBuilder.getNormalizedAndHashedPII(
    value,
    type
  )
  const digest = protectedValue?.split('.', 1)[0]

  return digest && /^[a-f0-9]{64}$/u.test(digest) ?
      [digest]
    : undefined
}

export function protectShopifyCheckoutMetaObservation(
  observation: ShopifyCheckoutMetaObservationInput
) {
  const { customer, ...observationWithoutCustomer } = observation
  const customerMatch = {
    city_sha256: hash(customer.city, PII_DATA_TYPE.CITY),
    country_sha256: hash(
      customer.countryCode,
      PII_DATA_TYPE.COUNTRY
    ),
    email_sha256: hash(customer.email, PII_DATA_TYPE.EMAIL),
    first_name_sha256: hash(
      customer.firstName,
      PII_DATA_TYPE.FIRST_NAME
    ),
    last_name_sha256: hash(
      customer.lastName,
      PII_DATA_TYPE.LAST_NAME
    ),
    phone_sha256: hash(customer.phone, PII_DATA_TYPE.PHONE),
    postal_code_sha256: hash(
      customer.postalCode,
      PII_DATA_TYPE.ZIP_CODE
    ),
    state_sha256: hash(
      customer.provinceCode,
      PII_DATA_TYPE.STATE
    )
  }

  return shopifyCheckoutMetaObservationSchema.parse({
    ...observationWithoutCustomer,
    customerMatch: Object.fromEntries(
      Object.entries(customerMatch).filter(
        (entry): entry is [string, string[]] =>
          entry[1] !== undefined
      )
    )
  })
}
