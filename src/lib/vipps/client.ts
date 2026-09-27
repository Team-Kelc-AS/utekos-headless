import 'server-only'
import { z } from 'zod'
import type { VippsConfig } from './config'
import {
  vippsPaymentSchema,
  vippsReferenceSchema
} from './payment'

export class VippsApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly operation: string
  ) {
    // Never include request headers, token response, customer data or arbitrary provider text.
    super(`Vipps ${operation} failed (${status})`)
    this.name = 'VippsApiError'
  }
}

export function createVippsClient(
  config: VippsConfig,
  fetcher: typeof fetch = fetch
) {
  let cachedToken:
    | { value: string; expiresAt: number }
    | undefined
  let tokenRequest: Promise<string> | undefined
  const commonHeaders = {
    'Ocp-Apim-Subscription-Key': config.subscriptionKey,
    'Merchant-Serial-Number': config.msn,
    'Vipps-System-Name': 'utekos-headless',
    'Vipps-System-Version': '1.0.0',
    'Vipps-System-Plugin-Name': 'vipps-express',
    'Vipps-System-Plugin-Version': '1.0.0'
  }
  async function token(): Promise<string> {
    if (cachedToken && cachedToken.expiresAt > Date.now())
      return cachedToken.value
    if (tokenRequest) return tokenRequest
    tokenRequest = (async () => {
      const response = await fetcher(
        `${config.apiBaseUrl}/accesstoken/get`,
        {
          method: 'POST',
          body: '',
          cache: 'no-store',
          redirect: 'error',
          headers: {
            ...commonHeaders,
            client_id: config.clientId,
            client_secret: config.clientSecret
          },
          signal: AbortSignal.timeout(8000)
        }
      )
      if (!response.ok)
        throw new VippsApiError(response.status, 'token')
      const parsed = z
        .object({
          access_token: z.string().min(1),
          token_type: z.literal('Bearer'),
          expires_in: z.coerce.number().int().positive()
        })
        .safeParse(await response.json())
      if (!parsed.success)
        throw new VippsApiError(502, 'token_response')
      cachedToken = {
        value: parsed.data.access_token,
        expiresAt:
          Date.now() +
          Math.max(0, parsed.data.expires_in - 60) * 1000
      }
      return cachedToken.value
    })()
    try {
      return await tokenRequest
    } finally {
      tokenRequest = undefined
    }
  }
  async function request(
    path: string,
    method: 'GET' | 'POST',
    key?: string,
    body?: unknown
  ) {
    if (
      method === 'POST' &&
      (!key || !/^[a-zA-Z0-9-]{8,64}$/.test(key))
    ) {
      throw new Error(
        'A stable Vipps idempotency key is required'
      )
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      const accessToken = await token()
      const response = await fetcher(
        `${config.apiBaseUrl}${path}`,
        {
          method,
          cache: 'no-store',
          redirect: 'error',
          headers: {
            ...commonHeaders,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...(key ? { 'Idempotency-Key': key } : {})
          },
          ...(body === undefined ?
            {}
          : { body: JSON.stringify(body) }),
          signal: AbortSignal.timeout(8000)
        }
      )
      if (response.status === 401 && attempt === 0) {
        if (cachedToken?.value === accessToken)
          cachedToken = undefined
        continue
      }
      if (!response.ok)
        throw new VippsApiError(
          response.status,
          path.replace(
            /\/payments\/[^/]+/,
            '/payments/:reference'
          )
        )
      if (response.status === 204) return null
      const text = await response.text()
      if (!text) return null
      try {
        return JSON.parse(text) as unknown
      } catch {
        throw new VippsApiError(502, 'response')
      }
    }
    throw new VippsApiError(401, 'authentication')
  }
  const pathFor = (reference: string) =>
    `/epayment/v1/payments/${vippsReferenceSchema.parse(reference)}`
  return {
    async createPayment(
      body: Record<string, unknown>,
      key: string
    ) {
      const result = z
        .object({
          reference: vippsReferenceSchema,
          redirectUrl: z.url()
        })
        .safeParse(
          await request(
            '/epayment/v1/payments',
            'POST',
            key,
            body
          )
        )
      if (!result.success)
        throw new VippsApiError(502, 'create_response')
      return result.data
    },
    async getPayment(reference: string) {
      const result = vippsPaymentSchema.safeParse(
        await request(pathFor(reference), 'GET')
      )
      if (!result.success)
        throw new VippsApiError(502, 'payment_response')
      return result.data
    },
    async capture(
      reference: string,
      amount: number,
      key: string
    ) {
      if (!Number.isSafeInteger(amount) || amount < 1)
        throw new Error('Invalid capture amount')
      await request(
        `${pathFor(reference)}/capture`,
        'POST',
        key,
        {
          modificationAmount: { currency: 'NOK', value: amount }
        }
      )
    },
    async cancel(reference: string, key: string) {
      await request(`${pathFor(reference)}/cancel`, 'POST', key)
    },
    async refund(
      reference: string,
      amount: number,
      key: string
    ) {
      if (!Number.isSafeInteger(amount) || amount < 1)
        throw new Error('Invalid refund amount')
      await request(
        `${pathFor(reference)}/refund`,
        'POST',
        key,
        {
          modificationAmount: { currency: 'NOK', value: amount }
        }
      )
    },
    getEvents(reference: string) {
      return request(`${pathFor(reference)}/events`, 'GET')
    }
  }
}

export type VippsClient = ReturnType<typeof createVippsClient>
