import { z } from 'zod'
import {
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
    buyerIp?: string
    handles?: string[]
  }): Promise<AssistantProduct[]>
  supportKnowledge: SupportKnowledgeAdapter
  commerceRecommendation: CommerceRecommendationAdapter
}

const selectedOptionSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  value: z.string().trim().min(1).max(200)
})

const assistantVariantSchema = z.strictObject({
  id: z.string().trim().min(1).max(300),
  title: z.string().trim().min(1).max(200),
  availableForSale: z.boolean(),
  selectedOptions: z.array(selectedOptionSchema).max(10)
})

const assistantProductSchema = z
  .strictObject({
    id: z.string().trim().min(1).max(300),
    handle: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: z.string().trim().min(1).max(200),
    href: z.string().regex(/^\/produkter\/[a-z0-9-]+$/),
    image: z
      .strictObject({
        alt: z.string().max(500),
        url: z.string().url().max(2_048)
      })
      .nullable(),
    price: z.strictObject({
      amount: z.string().regex(/^\d+(?:\.\d+)?$/),
      currencyCode: z.string().regex(/^[A-Z]{3}$/)
    }),
    variants: z.array(assistantVariantSchema).max(20)
  })
  .refine(
    product => product.href === `/produkter/${product.handle}`,
    'Product href must match the canonical product handle'
  )

export const assistantProductsResultSchema = z
  .array(assistantProductSchema)
  .max(20)

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
