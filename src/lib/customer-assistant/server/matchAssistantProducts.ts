import { assistantProductProfiles } from '../assistantProductProfiles'
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

function normalizeAssistantText(text: string) {
  return text.trim().toLocaleLowerCase('nb-NO')
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
      const matchedCueCount = profile.cues.filter(cue =>
        normalizedText.includes(cue)
      ).length

      return {
        product,
        profile,
        profileIndex,
        matchedCueCount,
        score:
          matchedCueCount +
          (profile.handle === currentProductHandle ? 1 : 0)
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
        score: number
      } =>
        candidate.product !== undefined &&
        candidate.matchedCueCount > 0 &&
        candidate.product.variants.some(
          variant => variant.availableForSale
        )
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
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
