'use client'

import type {
  KlarnaIdentitySdk,
  KlarnaSdkFactory
} from '@/components/klarna/types/klarnaIdentity'

const KLARNA_WEB_SDK_V2_URL =
  'https://js.klarna.com/web-sdk/v2/klarna.mjs'

let sdkFactoryPromise: Promise<KlarnaSdkFactory> | null = null

async function importKlarnaSdkFactory(): Promise<KlarnaSdkFactory> {
  const sdkModule = (await import(
    /* webpackIgnore: true */ KLARNA_WEB_SDK_V2_URL
  )) as { KlarnaSDK?: KlarnaSdkFactory }

  if (typeof sdkModule.KlarnaSDK !== 'function') {
    throw new Error('Klarna Identity SDK is not available')
  }

  return sdkModule.KlarnaSDK
}

export async function loadKlarnaIdentitySdk(input: {
  clientId: string
}): Promise<KlarnaIdentitySdk> {
  sdkFactoryPromise ??= importKlarnaSdkFactory()
  const KlarnaSDK = await sdkFactoryPromise

  return KlarnaSDK({
    clientId: input.clientId,
    locale: 'nb-NO',
    products: ['IDENTITY']
  })
}
