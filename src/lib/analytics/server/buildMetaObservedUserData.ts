import 'server-only'

import {
  PII_DATA_TYPE,
  ParamBuilder
} from 'capi-param-builder-nodejs'
import { UserData } from 'facebook-nodejs-business-sdk'

type MetaObservedUserData = {
  client_ip_address?: string | undefined
  client_user_agent?: string | undefined
  email_sha256?: string[] | undefined
  external_id?: string | undefined
  fb_login_id?: string | undefined
  fbc?: string | undefined
  fbp?: string | undefined
  phone_sha256?: string[] | undefined
}

const piiBuilder = new ParamBuilder(['utekos.no'])

export function buildMetaObservedUserData(
  input: MetaObservedUserData
) {
  const userData = new UserData()

  if (input.email_sha256?.length) {
    userData.setEmails(input.email_sha256)
  }
  if (input.phone_sha256?.length) {
    userData.setPhones(input.phone_sha256)
  }
  if (input.external_id) {
    const externalId = piiBuilder.getNormalizedAndHashedPII(
      input.external_id,
      PII_DATA_TYPE.EXTERNAL_ID
    )
    if (externalId) userData.setExternalId(externalId)
  }
  if (input.fb_login_id) userData.setFbLoginId(input.fb_login_id)
  if (input.client_ip_address) {
    userData.setClientIpAddress(input.client_ip_address)
  }
  if (input.client_user_agent) {
    userData.setClientUserAgent(input.client_user_agent)
  }
  if (input.fbc) userData.setFbc(input.fbc)
  if (input.fbp) userData.setFbp(input.fbp)

  return userData
}
