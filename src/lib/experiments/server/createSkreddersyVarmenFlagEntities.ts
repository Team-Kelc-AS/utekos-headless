import 'server-only'
import { createHash } from 'node:crypto'
import type { SkreddersyVarmenFlagEntities } from '@/flags'
import { SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY } from '@/lib/experiments/skreddersyVarmenLayoutExperiment'

export function createSkreddersyVarmenFlagEntities(
  googleAnalyticsCookie: string
): SkreddersyVarmenFlagEntities {
  return {
    user: {
      id: createHash('sha256')
        .update(
          SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY +
            ':' +
            googleAnalyticsCookie
        )
        .digest('hex')
    }
  }
}
