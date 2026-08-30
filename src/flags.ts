import 'server-only'
import { vercelAdapter } from '@flags-sdk/vercel'
import { flag } from 'flags/next'
import {
  SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY,
  type SkreddersyVarmenLayoutVariant
} from '@/lib/experiments/skreddersyVarmenLayoutExperiment'

export type SkreddersyVarmenFlagEntities = {
  user: { userId: string }
}

export const skreddersyVarmenLayoutFlag = flag<
  SkreddersyVarmenLayoutVariant,
  SkreddersyVarmenFlagEntities
>({
  key: SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY,
  description:
    'Sammenligner dagens /skreddersy-varmen med versjonen før relanseringen 29. august 2026.',
  defaultValue: 'current',
  options: [
    { label: 'Dagens side', value: 'current' },
    { label: 'Tidligere side', value: 'legacy' }
  ],
  adapter: vercelAdapter
})
