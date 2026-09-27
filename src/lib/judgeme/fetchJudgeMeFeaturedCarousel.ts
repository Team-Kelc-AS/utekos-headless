import { getShopifyAdminConfig } from '@/lib/shopify/getShopifyAdminConfig'
import { parseFeaturedCarouselHtml } from './parseFeaturedCarouselHtml'
import type { JudgeMeFeaturedCarousel } from './types'

type JudgeMeShopMetafieldsResponse = {
  data?: {
    shop?: {
      allReviewsRating?: { value: string } | null
      allReviewsCount?: { value: string } | null
      featuredCarousel?: { value: string } | null
    }
  }
  errors?: Array<{ message: string }>
}

const JUDGEME_CAROUSEL_QUERY = /* GraphQL */ `
  query JudgeMeFeaturedCarouselMetafields {
    shop {
      allReviewsRating: metafield(
        namespace: "judgeme"
        key: "all_reviews_rating"
      ) {
        value
      }
      allReviewsCount: metafield(
        namespace: "judgeme"
        key: "all_reviews_count"
      ) {
        value
      }
      featuredCarousel: metafield(
        namespace: "judgeme"
        key: "featured_carousel"
      ) {
        value
      }
    }
  }
`

function parsePositiveNumber(value: string | undefined): number | null {
  if (!value) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

export async function fetchJudgeMeFeaturedCarousel(): Promise<JudgeMeFeaturedCarousel | null> {
  const { accessToken, graphqlUrl } = getShopifyAdminConfig()

  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({ query: JUDGEME_CAROUSEL_QUERY })
  })

  if (!response.ok) {
    throw new Error(
      `Judge.me metafield fetch failed (${response.status})`
    )
  }

  const json = (await response.json()) as JudgeMeShopMetafieldsResponse

  if (json.errors?.length) {
    throw new Error(
      `Judge.me metafield GraphQL errors: ${JSON.stringify(json.errors)}`
    )
  }

  const shop = json.data?.shop
  const ratingValue = parsePositiveNumber(shop?.allReviewsRating?.value)
  const reviewCount = parsePositiveNumber(shop?.allReviewsCount?.value)
  const featuredCarouselHtml = shop?.featuredCarousel?.value

  if (
    ratingValue == null ||
    reviewCount == null ||
    !featuredCarouselHtml
  ) {
    return null
  }

  const reviews = parseFeaturedCarouselHtml(featuredCarouselHtml)
  if (reviews.length === 0) return null

  return {
    ratingValue,
    reviewCount: Math.round(reviewCount),
    reviews
  }
}
