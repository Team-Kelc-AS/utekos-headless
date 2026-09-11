import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fetchMetaInsightsLiveSnapshot } from '../../src/lib/meta-insights/fetchMetaInsightsLiveSnapshot'
import { slimMetaInsightsLiveSnapshot } from '../../src/lib/meta-insights/slimMetaInsightsLiveSnapshot'

function readFlag(name: string) {
  const index = process.argv.indexOf(name)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
}

async function main() {
  const snapshot = await fetchMetaInsightsLiveSnapshot()
  const slim = slimMetaInsightsLiveSnapshot(snapshot)
  const out = readFlag('--out')
  const slimOut = readFlag('--slim')

  if (out) await writeJson(out, snapshot)
  if (slimOut) await writeJson(slimOut, slim)
  if (!out && !slimOut) {
    process.stdout.write(`${JSON.stringify(slim, null, 2)}\n`)
    return
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        fetchedAtOslo: slim.fetchedAtOslo,
        out: out ?? null,
        slim: slimOut ?? null,
        accountId: slim.accountId,
        adSetKeys: Object.keys(slim.adSets)
      },
      null,
      2
    )}\n`
  )
}

await main()
