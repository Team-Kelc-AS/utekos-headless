declare module 'meta-capi-param-builder-clientjs' {
  export type ClientMetaParameters = {
    client_ip_address?: string | undefined
    fbc?: string | undefined
    fbp?: string | undefined
  }

  export type ClientParamBuilder = {
    getClientIpAddress(): string | null
    getFbc(): string | null
    getFbp(): string | null
    getNormalizedAndHashedPII(
      value: string,
      type: string
    ): string | null
    processAndCollectAllParams(
      pageUrl: string,
      getIpFn?: (() => Promise<string>) | undefined
    ): Promise<ClientMetaParameters>
  }

  const clientParamBuilder: ClientParamBuilder
  export default clientParamBuilder
}
