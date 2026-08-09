import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import { render } from '@react-email/render'
import { createElement } from 'react'

import { AbandonedCheckoutRecoveryEmail } from '../../src/components/emails/AbandonedCheckoutRecoveryEmail'
import { runAbandonedCheckoutRecoveryDesignPreview } from '../../src/lib/email/abandonedCheckoutRecovery/runAbandonedCheckoutRecoveryDesignPreview'

const outputArgumentIndex = process.argv.indexOf('--output')
const requestedOutputDirectory =
  outputArgumentIndex >= 0 ?
    process.argv.at(outputArgumentIndex + 1)
  : undefined
const outputDirectory = path.resolve(
  requestedOutputDirectory ??
    '.agent-artifacts/abandoned-checkout-recovery'
)

const previewUrls = {
  recoveryUrl: 'https://kasse.utekos.no/checkouts/example/recovery-token',
  unsubscribeUrl: 'https://utekos.no/avmelding?token=design-preview'
} as const

async function main(): Promise<void> {
  await mkdir(outputDirectory, { recursive: true })

  await runAbandonedCheckoutRecoveryDesignPreview({
    renderFrame: async frame => {
      for (const offerType of ['generic', 'staycomfy'] as const) {
        const html = await render(
          createElement(AbandonedCheckoutRecoveryEmail, {
            step: frame.step,
            offerType,
            productImage:
              offerType === 'staycomfy' ?
                {
                  url: 'https://utekos.no/og-image-comfyrobe.jpg',
                  alt: 'Marineblå Comfyrobe fra Utekos'
                }
              : {
                  url: 'https://utekos.no/og-image-utekos-produkter.jpg',
                  alt: 'Utvalgte produkter fra Utekos'
                },
            ...previewUrls
          })
        )
        const fileName = `step-${frame.step}-${offerType}.html`

        await writeFile(path.join(outputDirectory, fileName), html, 'utf8')
      }

      process.stdout.write(
        `Rendered step ${frame.step} at ${frame.elapsedMs / 1000}s (no send)\n`
      )
    }
  })

  await writeFile(
    path.join(outputDirectory, 'manifest.json'),
    `${JSON.stringify(
      {
        mode: 'no-send',
        durationSeconds: 30,
        variants: ['generic', 'staycomfy'],
        steps: [1, 2, 3]
      },
      null,
      2
    )}\n`,
    'utf8'
  )

  process.stdout.write(`Preview complete: ${outputDirectory}\n`)
}

void main().catch(error => {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Preview failed'}\n`
  )
  process.exitCode = 1
})
