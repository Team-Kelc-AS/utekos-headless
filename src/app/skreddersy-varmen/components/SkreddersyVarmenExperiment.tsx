import { FlagValues } from 'flags/react'
import { resolveSkreddersyVarmenLayoutAssignment } from '@/lib/experiments/server/resolveSkreddersyVarmenLayoutAssignment'
import {
  SKREDDERSY_VARMEN_LAYOUT_FLAG_KEY,
  type SkreddersyVarmenLayoutVariant
} from '@/lib/experiments/skreddersyVarmenLayoutExperiment'
import { LegacySkreddersyVarmenPageRuntime } from '../variants/legacy/LegacySkreddersyVarmenPageRuntime'

function renderAssignedOverlay(
  variant: SkreddersyVarmenLayoutVariant
) {
  switch (variant) {
    case 'legacy':
      return (
        <>
          <style>{'[data-skreddersy-route]{display:none!important}'}</style>
          <LegacySkreddersyVarmenPageRuntime />
        </>
      )
    case 'current':
      return null
    default: {
      const _exhaustive: never = variant
      throw new Error(
        `Unhandled skreddersy-varmen layout variant: ${String(_exhaustive)}`
      )
    }
  }
}

export async function SkreddersyVarmenExperiment() {
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
        hidden
        {...(assignment ?
          {
            'data-experiment-key': assignment.key,
            'data-experiment-variant': assignment.variant
          }
        : {})}
        data-experiment-eligible={assignment ? 'true' : 'false'}
      />
      {renderAssignedOverlay(variant)}
    </>
  )
}
