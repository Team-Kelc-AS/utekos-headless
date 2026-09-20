import manifest from '../../../contracts/events/canonical-event-manifest/v1/canonical-event-manifest.v1.json'
import { buildCanonicalContext } from './buildCanonicalContext'

export function getCanonicalContext(input: unknown) {
  return buildCanonicalContext(
    input,
    manifest,
    process.env.VERCEL_GIT_COMMIT_SHA ?? null
  )
}
