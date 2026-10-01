'use client'

const BUTTON_ELEMENT = 'vipps-mobilepay-button'
const BUTTON_SCRIPT =
  'https://cdn.vippsmobilepay.com/js/button/button.js'

let loading: Promise<void> | undefined

function loadButton(): Promise<void> {
  if (customElements.get(BUTTON_ELEMENT)) return Promise.resolve()
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = BUTTON_SCRIPT
    script.async = true
    script.dataset.vippsButtonLibrary = ''
    script.onload = () => {
      void customElements
        .whenDefined(BUTTON_ELEMENT)
        .then(() => resolve(), reject)
    }
    script.onerror = () => {
      loading = undefined
      script.remove()
      reject(new Error('Vipps button library failed to load'))
    }
    document.head.append(script)
  })
  return loading
}

export async function mountVippsButton(
  selector: string,
  action:
    | { click: () => void }
    | {
        resolve: () => Promise<{
          redirectUrl: string
          checkoutMode: 'shopify' | 'vipps'
        }>
      }
) {
  await loadButton()
  const target = document.querySelector(selector)
  if (!target) throw new Error('Vipps button target unavailable')

  const button = document.createElement(BUTTON_ELEMENT)
  button.setAttribute('type', 'button')
  button.setAttribute('brand', 'vipps')
  button.setAttribute('language', 'no')
  button.setAttribute('verb', 'buy')
  button.setAttribute('variant', 'primary')
  button.setAttribute('stretched', 'true')
  button.setAttribute('rounded', 'true')
  button.style.display = 'block'
  button.style.width = '100%'

  const onClick = () => {
    if ('click' in action) {
      action.click()
      return
    }
    void action.resolve().then(
      result => window.location.assign(result.redirectUrl),
      () => {
        // The checkout action reports a retryable error in the dialog.
      }
    )
  }
  button.addEventListener('click', onClick)
  target.replaceChildren(button)

  return () => {
    button.removeEventListener('click', onClick)
    button.remove()
  }
}
