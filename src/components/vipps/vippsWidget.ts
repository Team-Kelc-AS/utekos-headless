'use client'

type ButtonBuilder = {
  brand(value: 'vipps'): ButtonBuilder
  language(value: 'no'): ButtonBuilder
  verb(value: 'buy' | 'express'): ButtonBuilder
  variant(value: 'primary'): ButtonBuilder
  stretched(value: boolean): ButtonBuilder
  rounded(value: boolean): ButtonBuilder
  onclick(handler: () => void): ButtonBuilder
  mount(selector: string): ButtonBuilder
  unmount(): void
}
type Trigger = { button(): ButtonBuilder; close(): void }
type VippsSdk = {
  host(): { start(): void; stop(): void }
  consent(value: {
    rememberMe: boolean
    analytics: boolean
  }): void
  button(): ButtonBuilder
  trigger(resolver: () => Promise<string>): Trigger
}
let loading: Promise<VippsSdk> | undefined
let host: ReturnType<VippsSdk['host']> | undefined
let consumers = 0

function load(): Promise<VippsSdk> {
  loading ??= new Promise((resolve, reject) => {
    const ready = () => {
      const sdk = (window as Window & { vipps?: VippsSdk }).vipps
      if (!sdk) {
        reject(new Error('Vipps SDK unavailable'))
        return
      }
      // Do not opt visitors into Vipps-origin analytics or personalization by default.
      sdk.consent({ rememberMe: false, analytics: false })
      resolve(sdk)
    }
    if ((window as Window & { vipps?: VippsSdk }).vipps) {
      ready()
      return
    }
    const script = document.createElement('script')
    script.src =
      'https://cdn.vippsmobilepay.com/js/widget-sdk/vipps-widget.js'
    script.async = true
    script.setAttribute('data-vipps-widget-sdk', '')
    script.onload = ready
    script.onerror = () => {
      loading = undefined
      script.remove()
      reject(new Error('Vipps SDK failed to load'))
    }
    document.head.append(script)
  })
  return loading
}

export async function mountVippsButton(
  selector: string,
  action:
    | { click: () => void }
    | { resolve: () => Promise<string> }
) {
  const sdk = await load()
  if (consumers++ === 0) {
    host = sdk.host()
    host.start()
  }
  const trigger =
    'resolve' in action ? sdk.trigger(action.resolve) : undefined
  let button = trigger ? trigger.button() : sdk.button()
  if ('click' in action) button = button.onclick(action.click)
  button
    .brand('vipps')
    .language('no')
    .verb('express')
    .variant('primary')
    .stretched(true)
    .rounded(true)
    .mount(selector)
  return () => {
    button.unmount()
    trigger?.close()
    if (--consumers === 0) {
      host?.stop()
      host = undefined
    }
  }
}
