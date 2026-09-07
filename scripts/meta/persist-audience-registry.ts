import { readFile, realpath } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, sep } from 'node:path'
import { z } from 'zod'
import { persistAudienceRegistry } from '../../src/lib/meta-audiences/persistAudienceRegistry'
import { registrySnapshotSchema } from '../../src/lib/meta-audiences/registrySnapshotSchema'

async function main() {
  const args = process.argv.slice(2)
  const file = args
    .find(arg => arg.startsWith('--file='))
    ?.slice(7)
  if (
    !file ||
    args.some(
      arg => !arg.startsWith('--file=') && arg !== '--apply'
    )
  )
    throw new Error(
      'Usage: --file=<private registry.json> [--apply]'
    )
  const path = await realpath(file)
  const privateRoot = await realpath(
    join(homedir(), 'Lister', 'Meta-audience-governance')
  )
  if (!path.startsWith(privateRoot + sep))
    throw new Error(
      'Registry must be inside the private audience-governance directory'
    )
  const report = registrySnapshotSchema.parse(
    JSON.parse(await readFile(path, 'utf8'))
  )
  if (!args.includes('--apply')) {
    console.log(
      JSON.stringify({
        mode: 'plan',
        runId: report.runId,
        audienceCount: report.audiences.length,
        segmentCount: report.segments.length
      })
    )
    return
  }
  console.log(
    JSON.stringify(await persistAudienceRegistry(report))
  )
}

main().catch(error => {
  console.error(
    error instanceof z.ZodError ?
      'Registry validation failed; no raw data logged'
    : error instanceof Error ? error.message
    : 'Registry persistence failed'
  )
  process.exitCode = 1
})
