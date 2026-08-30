import { FlagValues } from 'flags/react'
import { SkreddersyVarmenPageRuntime } from './SkreddersyVarmenPageRuntime'
import { resolveSkreddersyVarmenLayoutAssignment } from '@/lib/experiments/server/resolveSkreddersyVarmenLayoutAssignment'
import { SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY } from '@/lib/experiments/skreddersyVarmenLayoutExperiment'
import { LegacySkreddersyVarmenPageRuntime } from '../variants/legacy/LegacySkreddersyVarmenPageRuntime'
import type { LandingSearchParams } from './SkreddersyVarmenPageRuntime'
import type { SkreddersyVarmenPageContent } from '../data/skreddersyVarmenPageModel'

export async function SkreddersyVarmenExperiment({
  content,
  searchParams
}: {
  content: SkreddersyVarmenPageContent
  searchParams: LandingSearchParams
}) {
  const assignment =
    await resolveSkreddersyVarmenLayoutAssignment()
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
            content={content}
            searchParams={searchParams}
          />
        }
      </div>
    </>
  )
}
