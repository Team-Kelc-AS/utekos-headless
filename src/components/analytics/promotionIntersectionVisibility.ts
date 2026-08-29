type PromotionIntersection = Pick<
  IntersectionObserverEntry,
  'intersectionRatio' | 'isIntersecting'
>

export function isPromotionIntersectionVisible(
  entry: PromotionIntersection,
  minimumVisibleRatio: number
): boolean {
  return (
    entry.isIntersecting &&
    entry.intersectionRatio >= minimumVisibleRatio
  )
}
