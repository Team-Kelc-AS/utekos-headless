import type { ClientMetaParameters } from 'meta-capi-param-builder-clientjs'
import type { MetaClientParameterContext } from './metaClientParameterBuilder'

export function mapMetaClientParameterContext(
  parameters: ClientMetaParameters
): MetaClientParameterContext {
  return {
    ...(parameters._fbi ?
      { clientIpAddress: parameters._fbi }
    : {}),
    ...(parameters._fbc ? { fbc: parameters._fbc } : {}),
    ...(parameters._fbp ? { fbp: parameters._fbp } : {})
  }
}
