import 'server-only'

import { z } from 'zod'

const signalsGatewayPixelEnvironmentSchema = z.object({
  SIGNALS_GATEWAY_PIXEL_ENABLED: z
    .enum(['true', 'false'])
    .optional()
})

const signalsGatewayPixelConfigSchema = z.object({
  enabled: z.boolean(),
  host: z.literal('https://signals.utekos.no/'),
  pixelId: z.literal('1633085772154426486'),
  startupTimeoutMs: z.literal(2500)
})

export type SignalsGatewayPixelConfig = z.infer<
  typeof signalsGatewayPixelConfigSchema
>

export function readSignalsGatewayPixelConfig(
  environment: Record<string, string | undefined>
): SignalsGatewayPixelConfig {
  const parsedEnvironment =
    signalsGatewayPixelEnvironmentSchema.parse(environment)

  return signalsGatewayPixelConfigSchema.parse({
    enabled:
      parsedEnvironment.SIGNALS_GATEWAY_PIXEL_ENABLED ===
      'true',
    host: 'https://signals.utekos.no/',
    pixelId: '1633085772154426486',
    startupTimeoutMs: 2500
  })
}
