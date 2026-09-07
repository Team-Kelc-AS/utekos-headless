import { readFile, writeFile, realpath } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, sep } from 'node:path'
import { z } from 'zod'
import { buildTechDownExperimentSpec } from '../../src/lib/meta-audiences/buildTechDownExperimentSpec'
import { renderAudienceReview } from '../../src/lib/meta-audiences/renderAudienceReview'

async function main() {
  const file = process.argv[2]
  if (!file)
    throw new Error('Specify private registry.json path')
  const path = await realpath(file)
  const privateRoot = await realpath(
    join(homedir(), 'Lister', 'Meta-audience-governance')
  )
  if (!path.startsWith(privateRoot + sep))
    throw new Error('Input must be a private audience registry')
  const report: unknown = JSON.parse(
    await readFile(path, 'utf8')
  )
  const output = dirname(path)
  const csv =
    [
      'relative_day,cell,planned_average_daily_nok,spend_nok,meta_attributed_purchases,shopify_paid_purchases,verified_new_customers,unknown_customer_status,unattributed_purchases,contribution_before_ads_nok,contribution_after_ads_nok,new_customer_cac_nok,data_status',
      ...Array.from({ length: 14 }, (_, day) =>
        ['A', 'B'].map(
          cell => `${day + 1},${cell},1500,,,,,,,,,,uncollected`
        )
      ).flat()
    ].join('\n') + '\n'
  await writeFile(
    join(output, 'REVIEW.md'),
    renderAudienceReview(report),
    { flag: 'wx', mode: 0o600 }
  )
  await writeFile(
    join(output, 'experiment-spec-v1.json'),
    JSON.stringify(buildTechDownExperimentSpec(), null, 2),
    { flag: 'wx', mode: 0o600 }
  )
  await writeFile(join(output, 'measurement.csv'), csv, {
    flag: 'wx',
    mode: 0o600
  })
  console.log(
    JSON.stringify({
      output,
      providerCreated: false,
      activated: false
    })
  )
}

main().catch(error => {
  console.error(
    error instanceof z.ZodError ?
      'Registry validation failed; no raw data logged'
    : error instanceof Error ? error.message
    : 'Review preparation failed'
  )
  process.exitCode = 1
})
