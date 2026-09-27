import type { JudgeMeCarouselReview } from './types'

function decodeBasicHtmlEntities(value: string): string {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&nbsp;', ' ')
}

function stripTags(value: string): string {
  return decodeBasicHtmlEntities(value.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}

function firstMatch(source: string, pattern: RegExp): string | null {
  const match = pattern.exec(source)
  return match?.[1]?.trim() ?? null
}

function parseRating(itemHtml: string): number {
  const aria = firstMatch(
    itemHtml,
    /jdgm-carousel-item__review-rating[^>]*aria-label=['"](\d+(?:\.\d+)?)\s*stars?['"]/i
  )
  if (aria) {
    const parsed = Number(aria)
    if (Number.isFinite(parsed) && parsed > 0) return Math.min(5, parsed)
  }

  const onStars = itemHtml.match(/jdgm-star jdgm--on/g)?.length ?? 0
  return Math.min(5, Math.max(0, onStars))
}

/**
 * Extracts structured review cards from Judge.me's
 * `shop.metafields.judgeme.featured_carousel` HTML payload.
 */
export function parseFeaturedCarouselHtml(
  html: string
): JudgeMeCarouselReview[] {
  const itemPattern =
    /<div class='jdgm-carousel-item(?:\s[^']*)?' data-review-id='([^']+)'>([\s\S]*?)(?=<div class='jdgm-carousel-item(?:\s[^']*)?' data-review-id='|<div class='jdgm-carousel__arrows|$)/g

  const reviews: JudgeMeCarouselReview[] = []

  for (const match of html.matchAll(itemPattern)) {
    const id = match[1]
    const itemHtml = match[2]
    if (!id || !itemHtml) continue

    const body =
      stripTags(
        firstMatch(
          itemHtml,
          /jdgm-carousel-item__review-body[^>]*>([\s\S]*?)<\/div>/
        ) ?? ''
      ) || null

    if (!body) continue

    const titleRaw = stripTags(
      firstMatch(
        itemHtml,
        /jdgm-carousel-item__review-title[^>]*>([\s\S]*?)<\/div>/
      ) ?? ''
    )

    const author =
      stripTags(
        firstMatch(
          itemHtml,
          /jdgm-carousel-item__reviewer-name[^>]*>([\s\S]*?)<\/div>/
        ) ?? ''
      ) || 'Anonym'

    const reviewedOnFromAttr = firstMatch(
      itemHtml,
      /jdgm-carousel-item__timestamp[^>]*data-time=['"]([^'"]+)['"]/
    )
    const reviewedOnFromText = stripTags(
      firstMatch(
        itemHtml,
        /jdgm-carousel-item__timestamp[^>]*>([\s\S]*?)<\/div>/
      ) ?? ''
    )
    const reviewedOn =
      reviewedOnFromAttr ??
      (reviewedOnFromText.length > 0 ? reviewedOnFromText : null)

    const productTitle =
      firstMatch(
        itemHtml,
        /jdgm-carousel-item__product-image[^>]*alt=['"]([^'"]*)['"]/
      ) || null

    const productImageUrl =
      firstMatch(
        itemHtml,
        /jdgm-carousel-item__product-image[^>]*(?:data-src|src)=['"]([^'"]+)['"]/
      ) || null

    reviews.push({
      id,
      author,
      body,
      title: titleRaw || null,
      rating: parseRating(itemHtml),
      reviewedOn: reviewedOn && reviewedOn.length > 0 ? reviewedOn : null,
      productTitle,
      productImageUrl
    })
  }

  return reviews
}
