'use server'

import { gateway, generateText, Output, wrapLanguageModel } from 'ai'
import { devToolsMiddleware } from '@ai-sdk/devtools'
import { unstable_cache } from 'next/cache'
import {
  NBCC_AI_MODEL,
  NBCC_AI_MODEL_FALLBACK,
  NBCC_AI_SUMMARIES_CACHE_KEY,
  NBCC_AI_SUMMARIES_CACHE_REVALIDATE_SECONDS,
  NBCC_AI_SUMMARIES_TAG_PREFIX
} from '../constants'
import type { NbccAiSummaryIntent, NbccAiSummaryPayload } from '../types'
import { NbccAiSummarySchema } from '../types'
import { buildNbccPrompt } from './buildNbccPrompt'
import { normalizeSummaryPayload } from './normalizeSummaryPayload'

async function generateWithModel(
  intent: NbccAiSummaryIntent,
  modelId: string
): Promise<NbccAiSummaryPayload> {
  const model =
    process.env.NODE_ENV === 'development' ?
      wrapLanguageModel({
        model: gateway(modelId),
        middleware: devToolsMiddleware()
      })
    : gateway(modelId)

  const { output } = await generateText({
    model,
    output: Output.object({ schema: NbccAiSummarySchema }),
    prompt: buildNbccPrompt(intent),
    temperature: 0.25,
    maxOutputTokens: 1050
  })

  return normalizeSummaryPayload(output)
}

async function generateNbccAiSummaryUncached(intent: NbccAiSummaryIntent): Promise<NbccAiSummaryPayload> {
  try {
    return await generateWithModel(intent, NBCC_AI_MODEL)
  } catch (error) {
    console.warn(`[nbcc-ai-summary] primary model failed for ${intent}, retrying fallback`, error)

    return generateWithModel(intent, NBCC_AI_MODEL_FALLBACK)
  }
}

export async function generateNbccAiSummary(intent: NbccAiSummaryIntent): Promise<NbccAiSummaryPayload> {
  const cached = unstable_cache(
    (selectedIntent: NbccAiSummaryIntent) => generateNbccAiSummaryUncached(selectedIntent),
    [NBCC_AI_SUMMARIES_CACHE_KEY, intent],
    {
      revalidate: NBCC_AI_SUMMARIES_CACHE_REVALIDATE_SECONDS,
      tags: [`${NBCC_AI_SUMMARIES_TAG_PREFIX}${intent}`]
    }
  )

  return cached(intent)
}
