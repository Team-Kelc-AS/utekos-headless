import {
  assistantProductProfiles,
  countAssistantProfileCues,
  normalizeAssistantText
} from '../assistantProductProfiles'
import type {
  AssistantIntent,
  AssistantProduct,
  AssistantRecommendation
} from '../assistantProtocol'

type MatchAssistantProductsInput = {
  products: readonly AssistantProduct[]
  lastUserText: string
  intent: AssistantIntent
  currentProductHandle: string | null
}

export function matchAssistantProducts({
  products,
  lastUserText,
  currentProductHandle
}: MatchAssistantProductsInput): AssistantRecommendation[] {
  const normalizedText = normalizeAssistantText(lastUserText)
  const productsByHandle = new Map(
    products.map(product => [product.handle, product])
  )

  return assistantProductProfiles
    .map((profile, profileIndex) => {
      const product = productsByHandle.get(profile.handle)
      const matchedCueCount = countAssistantProfileCues(
        normalizedText,
        profile
      )

      return {
        product,
        profile,
        profileIndex,
        matchedCueCount,
        matchesCurrentProduct:
          profile.handle === currentProductHandle
      }
    })
    .filter(
      (
        candidate
      ): candidate is {
        product: AssistantProduct
        profile: (typeof assistantProductProfiles)[number]
        profileIndex: number
        matchedCueCount: number
        matchesCurrentProduct: boolean
      } =>
        candidate.product !== undefined &&
        candidate.matchedCueCount > 0 &&
        candidate.product.variants.some(
          variant => variant.availableForSale
        )
    )
    .sort(
      (left, right) =>
        right.matchedCueCount - left.matchedCueCount ||
        Number(right.matchesCurrentProduct) -
          Number(left.matchesCurrentProduct) ||
        left.profileIndex - right.profileIndex
    )
    .slice(0, 3)
    .map((candidate, index) => ({
      product: candidate.product,
      rank: (index + 1) as 1 | 2 | 3,
      reason: candidate.profile.reason,
      isPrimary: index === 0
    }))
}
