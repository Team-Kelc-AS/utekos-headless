import { createHmac, timingSafeEqual } from 'node:crypto'
import { checkBotId } from 'botid/server'

const SYNTHETIC_TIMESTAMP_HEADER =
  'x-utekos-synthetic-timestamp'
const SYNTHETIC_SIGNATURE_HEADER =
  'x-utekos-synthetic-signature'
const MAX_SYNTHETIC_CLOCK_SKEW_SECONDS = 5 * 60

type BrowserEventTrafficClass =
  | 'automated_bot'
  | 'human_or_unknown'
  | 'synthetic'
  | 'verified_bot'

type BrowserEventTrafficEnvironment = Readonly<
  Record<string, string | undefined>
>

export type BrowserEventTrafficVerdict = {
  classification: BrowserEventTrafficClass
  excludeFromMarketingDispatch: boolean
}

type BotIdVerdict = Awaited<ReturnType<typeof checkBotId>>

export type BrowserEventTrafficDependencies = {
  checkBot: () => Promise<BotIdVerdict>
  environment: BrowserEventTrafficEnvironment
  nowSeconds: () => number
}

const defaultDependencies: BrowserEventTrafficDependencies = {
  checkBot: () => checkBotId({
    advancedOptions: { checkLevel: 'basic' }
  }),
  environment: process.env,
  nowSeconds: () => Math.floor(Date.now() / 1000)
}

function syntheticSignaturePayload(
  request: Request,
  timestamp: string
) {
  return [
    request.method.toUpperCase(),
    new URL(request.url).pathname,
    timestamp
  ].join('\n')
}

function hasVerifiedSyntheticSignature(
  request: Request,
  dependencies: BrowserEventTrafficDependencies
) {
  const secret =
    dependencies.environment.UTEKOS_SYNTHETIC_TRAFFIC_SECRET
      ?.trim()
  const timestamp = request.headers.get(
    SYNTHETIC_TIMESTAMP_HEADER
  )
  const provided = request.headers.get(
    SYNTHETIC_SIGNATURE_HEADER
  )

  if (!secret || !timestamp || !provided) return false
  if (!/^\d{10}$/.test(timestamp)) return false

  const timestampSeconds = Number(timestamp)
  if (
    Math.abs(dependencies.nowSeconds() - timestampSeconds) >
    MAX_SYNTHETIC_CLOCK_SKEW_SECONDS
  ) {
    return false
  }

  const expected = createHmac('sha256', secret)
    .update(syntheticSignaturePayload(request, timestamp))
    .digest()
  let actual: Buffer

  try {
    actual = Buffer.from(provided, 'hex')
  } catch {
    return false
  }

  return (
    actual.length === expected.length &&
    timingSafeEqual(actual, expected)
  )
}

export async function classifyBrowserEventTraffic(
  request: Request,
  dependencies: BrowserEventTrafficDependencies =
    defaultDependencies
): Promise<BrowserEventTrafficVerdict> {
  if (hasVerifiedSyntheticSignature(request, dependencies)) {
    return {
      classification: 'synthetic',
      excludeFromMarketingDispatch: true
    }
  }

  try {
    const verdict = await dependencies.checkBot()

    if (verdict.isVerifiedBot) {
      return {
        classification: 'verified_bot',
        excludeFromMarketingDispatch: true
      }
    }

    if (verdict.isBot) {
      return {
        classification: 'automated_bot',
        excludeFromMarketingDispatch: true
      }
    }
  } catch (error) {
    console.error(
      '[tracking] BotID classification failed; collector remains fail-open',
      {
        method: request.method,
        path: new URL(request.url).pathname,
        error_name:
          error instanceof Error ? error.name : 'NonError'
      }
    )
  }

  return {
    classification: 'human_or_unknown',
    excludeFromMarketingDispatch: false
  }
}

export {
  SYNTHETIC_SIGNATURE_HEADER,
  SYNTHETIC_TIMESTAMP_HEADER,
  syntheticSignaturePayload
}
