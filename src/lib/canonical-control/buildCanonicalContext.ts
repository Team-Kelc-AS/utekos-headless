import { createHash } from 'node:crypto'
import { canonicalEventManifestSchema } from './controlManifest'
import { controlInputSchema } from './controlInput'
import { controlResultSchema } from './controlResult'
import { projectCanonicalContext } from './projectCanonicalContext.mjs'

export function buildCanonicalContext(
  input: unknown,
  sourceManifest: unknown,
  deploymentSha: string | null
) {
  const manifest =
    canonicalEventManifestSchema.parse(sourceManifest)
  const manifestSha = createHash('sha256')
    .update(`${JSON.stringify(manifest, null, 2)}\n`)
    .digest('hex')
  return controlResultSchema.parse(
    projectCanonicalContext(
      controlInputSchema.parse(input),
      manifest,
      manifestSha,
      deploymentSha
    )
  )
}
