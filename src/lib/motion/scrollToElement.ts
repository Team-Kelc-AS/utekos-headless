interface ScrollToElementOptions {
  duration?: number
  offsetY?: number
  reducedMotion?: boolean | null
}

function shouldReduceMotion(
  reducedMotion?: boolean | null
): boolean {
  if (typeof reducedMotion === 'boolean') {
    return reducedMotion
  }

  if (typeof window === 'undefined') {
    return true
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)')
    .matches
}

export function scrollToElement(
  targetId: string,
  { offsetY = 80, reducedMotion }: ScrollToElementOptions = {}
): void {
  if (typeof window === 'undefined') {
    return
  }

  const target = document.getElementById(targetId)
  if (!target) {
    return
  }

  const top =
    target.getBoundingClientRect().top + window.scrollY - offsetY

  window.scrollTo({
    top,
    behavior:
      shouldReduceMotion(reducedMotion) ? 'auto' : 'smooth'
  })
}
