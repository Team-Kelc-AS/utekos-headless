import {
  ParamBuilder,
  PII_DATA_TYPE
} from 'capi-param-builder-nodejs'

import {
  shopifyCheckoutMetaObservationSchema,
  type ShopifyCheckoutMetaObservationInput
} from '../shopifyCheckoutObservationContract'

const piiBuilder = new ParamBuilder(['utekos.no'])

function protect(value: string | undefined, type: string) {
  if (!value) return undefined

  const protectedValue = piiBuilder.getNormalizedAndHashedPII(
    value,
    type
  )
  const separator = protectedValue?.lastIndexOf('.') ?? -1
  const digest =
    separator > 0 ?
      protectedValue?.slice(0, separator)
    : undefined

  if (
    !protectedValue ||
    !digest ||
    !/^[a-f0-9]{64}$/u.test(digest) ||
    !/^[A-Za-z0-9_-]{8}$/u.test(
      protectedValue.slice(separator + 1)
    )
  ) {
    return undefined
  }

  return { digest, protectedValue }
}

export function protectShopifyCheckoutMetaObservation(
  observation: ShopifyCheckoutMetaObservationInput
) {
  const { customer, ...observationWithoutCustomer } = observation
  const protectedCustomer = {
    city: protect(customer.city, PII_DATA_TYPE.CITY),
    country: protect(
      customer.countryCode,
      PII_DATA_TYPE.COUNTRY
    ),
    email: protect(customer.email, PII_DATA_TYPE.EMAIL),
    first_name: protect(
      customer.firstName,
      PII_DATA_TYPE.FIRST_NAME
    ),
    last_name: protect(
      customer.lastName,
      PII_DATA_TYPE.LAST_NAME
    ),
    phone: protect(customer.phone, PII_DATA_TYPE.PHONE),
    postal_code: protect(
      customer.postalCode,
      PII_DATA_TYPE.ZIP_CODE
    ),
    state: protect(customer.provinceCode, PII_DATA_TYPE.STATE)
  }
  const customerMatch = {
    city_sha256:
      protectedCustomer.city ?
        [protectedCustomer.city.digest]
      : undefined,
    country_sha256:
      protectedCustomer.country ?
        [protectedCustomer.country.digest]
      : undefined,
    email_sha256:
      protectedCustomer.email ?
        [protectedCustomer.email.digest]
      : undefined,
    first_name_sha256:
      protectedCustomer.first_name ?
        [protectedCustomer.first_name.digest]
      : undefined,
    last_name_sha256:
      protectedCustomer.last_name ?
        [protectedCustomer.last_name.digest]
      : undefined,
    phone_sha256:
      protectedCustomer.phone ?
        [protectedCustomer.phone.digest]
      : undefined,
    postal_code_sha256:
      protectedCustomer.postal_code ?
        [protectedCustomer.postal_code.digest]
      : undefined,
    state_sha256:
      protectedCustomer.state ?
        [protectedCustomer.state.digest]
      : undefined
  }
  const metaParameterBuilderMatch = Object.fromEntries(
    Object.entries(protectedCustomer)
      .filter(
        (
          entry
        ): entry is [string, NonNullable<(typeof entry)[1]>] =>
          entry[1] !== undefined
      )
      .map(([name, protectedField]) => [
        name,
        [protectedField.protectedValue]
      ])
  )

  return shopifyCheckoutMetaObservationSchema.parse({
    ...observationWithoutCustomer,
    customerMatch: Object.fromEntries(
      Object.entries(customerMatch).filter(
        (entry): entry is [string, string[]] =>
          entry[1] !== undefined
      )
    ),
    ...(Object.keys(metaParameterBuilderMatch).length > 0 ?
      { metaParameterBuilderMatch }
    : {})
  })
}
