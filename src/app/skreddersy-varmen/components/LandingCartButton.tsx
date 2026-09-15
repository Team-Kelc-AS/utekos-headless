'use client'

export function LandingCartButton() {
  return (
    <button
      type='button'
      onClick={() =>
        window.dispatchEvent(new Event('utekos:landing:cart'))
      }
    >
      Handlekurv
    </button>
  )
}
