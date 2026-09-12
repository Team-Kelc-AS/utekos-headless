import { FlagValues } from 'flags/react'
import {
  SkreddersyVarmenPageRuntime,
  type LandingSearchParams
} from './SkreddersyVarmenPageRuntime'
import { resolveSkreddersyVarmenLayoutAssignment } from '@/lib/experiments/server/resolveSkreddersyVarmenLayoutAssignment'
import {
  SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY,
  type SkreddersyVarmenLayoutVariant
} from '@/lib/experiments/skreddersyVarmenLayoutExperiment'
import { LegacySkreddersyVarmenPageRuntime } from '../variants/legacy/LegacySkreddersyVarmenPageRuntime'
import type { SkreddersyVarmenPageContent } from '../data/skreddersyVarmenPageModel'

function renderAssignedLayout({
  content,
  searchParams,
  variant
}: {
  content: SkreddersyVarmenPageContent
  searchParams: LandingSearchParams
  variant: SkreddersyVarmenLayoutVariant
}) {
  switch (variant) {
    case 'legacy':
      return (
        <LegacySkreddersyVarmenPageRuntime
          searchParams={searchParams}
        />
      )
    case 'current':
      return (
        <SkreddersyVarmenPageRuntime
          content={content}
          searchParams={searchParams}
        />
      )
    default: {
      const _exhaustive: never = variant
      throw new Error(
        `Unhandled skreddersy-varmen layout variant: ${String(_exhaustive)}`
      )
    }
  }
}

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
        {renderAssignedLayout({
          content,
          searchParams,
          variant
        })}
      </div>
    </>
  )
}
