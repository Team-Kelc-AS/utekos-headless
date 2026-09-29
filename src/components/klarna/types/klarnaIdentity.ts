export type KlarnaIdentitySignInResponse = {
  customerProfile: {
    customerId: string
  }
}

export type KlarnaIdentityButton = {
  mount: (container: string | HTMLElement) => KlarnaIdentityButton
  on: (
    event: 'render' | 'click',
    callback: () => Promise<void>
  ) => KlarnaIdentityButton
  unmount: () => KlarnaIdentityButton
}

export type KlarnaIdentity = {
  button: (config: {
    clientType?: 'public' | 'confidential'
    id?: string
    locale?: string
    logoAlignment?: 'default' | 'left' | 'center'
    redirectUri: string
    scope: string
    shape?: 'default' | 'pill' | 'rect'
    theme?: 'default' | 'light' | 'dark' | 'outlined'
  }) => KlarnaIdentityButton
  on: {
    (
      event: 'signin',
      callback: (
        response: KlarnaIdentitySignInResponse
      ) => Promise<void>
    ): void
    (event: 'error', callback: (error: Error) => Promise<void>): void
  }
}

export type KlarnaIdentitySdk = {
  Identity: KlarnaIdentity
}

export type KlarnaSdkFactory = (config: {
  clientId: string
  locale?: string
  products?: Array<'IDENTITY'>
}) => Promise<KlarnaIdentitySdk>
