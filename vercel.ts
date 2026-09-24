import type { VercelConfig } from '@vercel/config/v1'
import { SCHEDULED_CRONS } from './config/cronRegistry'

export const config: VercelConfig = {
  functions: {
    'src/app/api/queues/canonical-provider-dispatch/route.ts': {
      experimentalTriggers: [
        {
          initialDelaySeconds: 0,
          retryAfterSeconds: 15,
          topic: 'canonical-provider-dispatch-v1',
          type: 'queue/v2beta'
        }
      ]
    }
  },
  crons: SCHEDULED_CRONS,
  headers: [
    {
      source: '/__sgtm/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, max-age=0'
        },
        {
          key: 'CDN-Cache-Control',
          value: 'no-store'
        },
        {
          key: 'Vercel-CDN-Cache-Control',
          value: 'no-store'
        }
      ]
    }
  ],
  regions: ['arn1']
}
