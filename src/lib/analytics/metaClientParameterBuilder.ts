'use client'

import type { ClientParamBuilder } from 'meta-capi-param-builder-clientjs'
import type { ConsentSnapshot } from './canonicalEventEnvelope'
import { metaClientIpResponseSchema } from './metaClientIpContract'

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

  if (!response.ok) return ''

  return metaClientIpResponseSchema.parse(await response.json())
    .client_ip_address
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
    input.consent.marketing !== 'granted'
  ) {
    return {}
  }

  return enqueueContextRequest(async () => {
    const builder = await loadClientParamBuilder()

    if (completedPageUrls.has(input.pageUrl)) {
      return readIdentifiers(builder)
    }

    await builder.processAndCollectAllParams(input.pageUrl, () =>
      getConsentedClientIpAddress(input.consent)
    )
    completedPageUrls.add(input.pageUrl)

    return readIdentifiers(builder)
  })
}
