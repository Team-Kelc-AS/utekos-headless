const LANDING_HEADER_OFFSET = 72

export function scrollToLandingReviews() {
  const reviews = document.getElementById('reviews-section')
  if (!reviews) {
    return
  }

  const top =
    reviews.getBoundingClientRect().top +
    window.scrollY -
    LANDING_HEADER_OFFSET

  const root = document.documentElement
  const previousBehavior = root.style.scrollBehavior
  root.style.setProperty('scroll-behavior', 'auto', 'important')

  window.scrollTo({
    left: 0,
    top,
    behavior: 'instant'
  })

  reviews.focus({ preventScroll: true })

  requestAnimationFrame(() => {
    if (previousBehavior) {
      root.style.scrollBehavior = previousBehavior
      return
    }

    root.style.removeProperty('scroll-behavior')
  })
}
