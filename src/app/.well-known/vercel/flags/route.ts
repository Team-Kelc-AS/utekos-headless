import { getProviderData } from '@flags-sdk/vercel'
import {
  createFlagsDiscoveryEndpoint,
  type KeyedFlagDefinitionType
} from 'flags/next'
import { skreddersyVarmenLayoutFlag } from '@/flags'

export const GET = createFlagsDiscoveryEndpoint(() =>
  getProviderData({
    // flags 4.3 exposes origin as optional while the Vercel helper
    // requires the same runtime flag shape with exact optional types.
    skreddersyVarmenLayoutFlag:
      skreddersyVarmenLayoutFlag as unknown as KeyedFlagDefinitionType
  })
)
