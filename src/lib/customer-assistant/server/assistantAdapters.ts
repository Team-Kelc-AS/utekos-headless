import { z } from 'zod'
import {
  assistantProductSchema,
  assistantSourceSchema,
  type AssistantProduct,
  type AssistantSource
} from '../assistantProtocol'

export type SupportKnowledgeResult = {
  text: string
  confidence: 'high' | 'medium' | 'low'
  sources: AssistantSource[]
}

export interface SupportKnowledgeAdapter {
  answer(input: {
    question: string
    productHandle: string | null
  }): Promise<SupportKnowledgeResult>
}

export interface CommerceRecommendationAdapter {
  recommend(input: {
    productIds: string[]
    sessionId: string
  }): Promise<string[]>
}

export type AssistantRequestContext = {
  buyerIp?: string
  failureCount: number
}

export type AssistantAdapters = {
  fetchProducts(input: {
    handles?: string[]
  }): Promise<AssistantProduct[]>
  supportKnowledge: SupportKnowledgeAdapter
  commerceRecommendation: CommerceRecommendationAdapter
}

export const assistantProductsResultSchema = z.array(
  assistantProductSchema
)

export const supportKnowledgeResultSchema = z.strictObject({
  text: z.string().trim().min(1).max(2_000),
  confidence: z.enum(['high', 'medium', 'low']),
  sources: z.array(assistantSourceSchema).max(5)
})

export const commerceRecommendationResultSchema = z
  .array(z.string().trim().min(1).max(300))
  .max(3)

export const staticCommerceRecommendationAdapter: CommerceRecommendationAdapter =
  {
    async recommend() {
      return []
    }
  }
