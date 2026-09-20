'use client'

import type { ClientParamBuilder } from 'meta-capi-param-builder-clientjs'
import type { ConsentSnapshot } from './canonicalEventEnvelope'
import { mapMetaClientParameterContext } from './mapMetaClientParameterContext'
import { metaClientIpResponseSchema } from './metaClientIpContract'
import { shouldCollectMetaClientIp } from './shouldCollectMetaClientIp'

function marketingAllowed() {
  return typeof window !== 'undefined'
}
const META_CLIENT_IP_TIMEOUT_MS = 2500
const completedPageUrls = new Set<string>()
let contextSequence: Promise<void> = Promise.resolve()

type EnsureMetaClientParameterContextInput = {
  consent: ConsentSnapshot
  pageUrl: string
}

export type MetaClientParameterContext = {
  clientIpAddress?: string | undefined
  fbc?: string | undefined
  fbp?: string | undefined
}

function enqueueContextRequest<T>(task: () => Promise<T>) {
  const result = contextSequence.then(task)
  contextSequence = result.then(
    () => undefined,
    () => undefined
  )
  return result
}

async function loadClientParamBuilder(): Promise<ClientParamBuilder> {
  const imported =
    await import('meta-capi-param-builder-clientjs')
  return imported.default
}

async function getConsentedClientIpAddress(
  consent: ConsentSnapshot
) {
  if (!marketingAllowed()) return undefined

  try {
    const response = await fetch('/api/meta/client-ip', {
      body: JSON.stringify({ consent }),
      cache: 'no-store',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      keepalive: true,
      method: 'POST',
      signal: AbortSignal.timeout(META_CLIENT_IP_TIMEOUT_MS)
    })

    if (!response.ok) return undefined

    const parsed = metaClientIpResponseSchema.safeParse(
      await response.json()
    )
    return parsed.success ? parsed.data.client_ip_address : undefined
  } catch {
    return undefined
  }
}

function readIdentifiers(
  builder: ClientParamBuilder
): MetaClientParameterContext {
  const clientIpAddress = builder.getClientIpAddress()
  const fbc = builder.getFbc()
  const fbp = builder.getFbp()

  return {
    ...(clientIpAddress ? { clientIpAddress } : {}),
    ...(fbc ? { fbc } : {}),
    ...(fbp ? { fbp } : {})
  }
}

export async function ensureMetaClientParameterContext(
  input: EnsureMetaClientParameterContextInput
): Promise<MetaClientParameterContext> {
  if (
    typeof window === 'undefined' ||
    input.consent.marketing !== 'granted' ||
    !marketingAllowed()
  ) {
    return {}
  }

  return enqueueContextRequest(async () => {
    if (!marketingAllowed()) return {}
    const builder = await loadClientParamBuilder()
    if (!marketingAllowed()) return {}

    if (completedPageUrls.has(input.pageUrl)) {
      return readIdentifiers(builder)
    }

    const clientIpAddress =
      shouldCollectMetaClientIp(
        input.pageUrl,
        process.env.NODE_ENV
      ) ?
        await getConsentedClientIpAddress(input.consent)
      : undefined

    const parameters = await builder.processAndCollectAllParams(
      input.pageUrl,
      clientIpAddress ? async () => clientIpAddress : undefined
    )
    if (!marketingAllowed()) return {}
    completedPageUrls.add(input.pageUrl)

    return mapMetaClientParameterContext(parameters)
  })
}
