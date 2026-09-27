export type JudgeMeCarouselReview = {
  id: string
  author: string
  body: string
  title: string | null
  rating: number
  reviewedOn: string | null
  productTitle: string | null
  productImageUrl: string | null
}

export type JudgeMeFeaturedCarousel = {
  ratingValue: number
  reviewCount: number
  reviews: JudgeMeCarouselReview[]
}
