import { z } from 'zod'

import {
  MICROSOFT_ADS_OAUTH_SCOPE,
  MICROSOFT_ADS_OAUTH_TOKEN_URL
} from './config.mjs'
import { requestMicrosoftAdsJson } from './http.mjs'

const oauthTokenResponseSchema = z
  .object({
    token_type: z.string().min(1).optional(),
    scope: z.string().optional(),
    expires_in: z.coerce.number().int().positive().optional(),
    ext_expires_in: z.coerce.number().int().positive().optional(),
    access_token: z.string().min(1),
    refresh_token: z.string().min(1).optional()
  })
  .passthrough()

export async function refreshMicrosoftAdsAccessToken(
  config,
  {
    fetchImpl = globalThis.fetch,
    timeoutMs = 30_000,
    signal,
    now = Date.now
  } = {}
) {
  const clientId = requireConfigValue(config?.clientId, 'clientId')
  const refreshToken = requireConfigValue(
    config?.refreshToken,
    'refreshToken'
  )

  const form = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: MICROSOFT_ADS_OAUTH_SCOPE
  })

  if (config?.clientSecret) {
    form.set('client_secret', config.clientSecret)
  }

  const raw = await requestMicrosoftAdsJson(
    MICROSOFT_ADS_OAUTH_TOKEN_URL,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form,
      fetchImpl,
      timeoutMs,
      signal
    }
  )

  const response = oauthTokenResponseSchema.parse(raw)

  const expiresInSeconds = response.expires_in ?? null

  const expiresAt =
    expiresInSeconds === null
      ? null
      : new Date(
          now() + expiresInSeconds * 1000
        ).toISOString()

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token ?? null,
    refreshTokenRotated: Boolean(
      response.refresh_token &&
        response.refresh_token !== refreshToken
    ),
    tokenType: response.token_type ?? 'Bearer',
    scope: response.scope ?? null,
    expiresInSeconds,
    expiresAt
  }
}

function requireConfigValue(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(
      `Microsoft Advertising OAuth ${field} is required.`
    )
  }

  return value.trim()
}