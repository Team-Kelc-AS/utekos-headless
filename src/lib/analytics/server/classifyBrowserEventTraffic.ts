import { checkBotId } from 'botid/server'
import { readLandingSyntheticCorrelationCookie } from '../landingEdgeCorrelation'
import { verifyLandingEdgeCorrelationToken } from '../landingEdgeCorrelationToken'
import {
  hasVerifiedSyntheticSignature,
  SYNTHETIC_SIGNATURE_HEADER,
  SYNTHETIC_TIMESTAMP_HEADER,
  syntheticSignaturePayload
} from '../syntheticTrafficSignature'

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

async function hasVerifiedSyntheticCorrelation(
  request: Request,
  dependencies: BrowserEventTrafficDependencies
) {
  const secret =
    dependencies.environment.LANDING_OBSERVABILITY_SIGNING_SECRET
      ?.trim()
  const correlation = readLandingSyntheticCorrelationCookie(
    request.headers.get('cookie') ?? ''
  )

  if (!secret || !correlation) return false

  return verifyLandingEdgeCorrelationToken({
    edgeRequestId: correlation.edgeRequestId,
    nowSeconds: dependencies.nowSeconds(),
    secret,
    token: correlation.token
  })
}

export async function classifyBrowserEventTraffic(
  request: Request,
  dependencies: BrowserEventTrafficDependencies =
    defaultDependencies
): Promise<BrowserEventTrafficVerdict> {
  if (
    (await hasVerifiedSyntheticSignature(
      request,
      dependencies.environment,
      dependencies.nowSeconds()
    )) ||
    (await hasVerifiedSyntheticCorrelation(
      request,
      dependencies
    ))
  ) {
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
