import { FlagValues } from 'flags/react'
import { SkreddersyVarmenPageRuntime } from './SkreddersyVarmenPageRuntime'
import {
  SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY,
  type SkreddersyVarmenLayoutAssignment
} from '@/lib/experiments/skreddersyVarmenLayoutExperiment'
import { LegacySkreddersyVarmenPageRuntime } from '../variants/legacy/LegacySkreddersyVarmenPageRuntime'
import type { LandingSearchParams } from './SkreddersyVarmenPageRuntime'
import { skreddersyVarmenPageContent } from '../data/skreddersyVarmenPageContent'

export function SkreddersyVarmenExperiment({
  assignment,
  searchParams
}: {
  assignment?: SkreddersyVarmenLayoutAssignment
  searchParams: LandingSearchParams
}) {
  const variant = assignment?.variant ?? 'current'

  return (
    <>
      {assignment ?
        <FlagValues
          values={{
            [SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY]: variant
          }}
        />
      : null}
      <div
        {...(assignment ?
          {
            'data-experiment-key': assignment.key,
            'data-experiment-variant': assignment.variant
          }
        : {})}
        data-experiment-eligible={assignment ? 'true' : 'false'}
      >
        {variant === 'legacy' ?
          <LegacySkreddersyVarmenPageRuntime
            searchParams={searchParams}
          />
        : <SkreddersyVarmenPageRuntime
            content={skreddersyVarmenPageContent}
            searchParams={searchParams}
          />
        }
      </div>
    </>
  )
}
