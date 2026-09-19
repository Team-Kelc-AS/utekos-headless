export function scrollToLandingSize() {
  window.dispatchEvent(new Event('utekos:landing:purchase'))
  const scroll = () => {
    const target = document.querySelector<HTMLElement>(
      '[data-landing-size-ready], #landing-size-selection, #purchase-section'
    )
    if (!target) return false
    target.scrollIntoView({
      behavior:
        (
          window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches
        ) ?
          'instant'
        : 'smooth',
      block: 'start'
    })
    target.focus({ preventScroll: true })
    return true
  }
  if (scroll()) return
  const observer = new MutationObserver(() => {
    if (scroll()) observer.disconnect()
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
  window.setTimeout(() => observer.disconnect(), 15000)
}
