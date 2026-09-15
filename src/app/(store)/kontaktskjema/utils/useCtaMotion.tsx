import * as React from 'react'

export function useCtaMotion<E extends HTMLElement>() {
  const ref = React.useRef<E | null>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduce.matches) return

    let done = false
    const io = new IntersectionObserver(
      entries => {
        if (done) return
        if (entries[0]?.isIntersecting) {
          done = true
          el.animate(
            [{ transform: 'translateY(8px)' }, { transform: 'translateY(0)' }],
            { duration: 450, easing: 'cubic-bezier(0.22,1,0.36,1)' }
          )
          el.animate(
            [
              { filter: 'brightness(1)' },
              { filter: 'brightness(1.06)' },
              { filter: 'brightness(1)' }
            ],
            { duration: 900, easing: 'ease-out' }
          )
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -20% 0px', threshold: 0.5 }
    )
    io.observe(el)

    const onClick = () => {
      el.animate(
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(1px)' },
          { transform: 'translateY(0)' }
        ],
        { duration: 140, easing: 'linear' }
      )
    }
    el.addEventListener('click', onClick)
    return () => {
      io.disconnect()
      el.removeEventListener('click', onClick)
    }
  }, [])

  return ref
}
