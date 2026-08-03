import { randomUUID } from 'node:crypto'
import {
  mkdir,
  readFile,
  rename,
  writeFile
} from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { z } from 'zod'
import {
  shopifyCheckoutObservationSchema,
  type ShopifyCheckoutObservation
} from '../shopifyCheckoutObservationContract'
import type {
  ShopifyCheckoutObservationStore,
  ShopifyCheckoutObservationWriteResult
} from './shopifyCheckoutObservationStore'
import { createShopifyCheckoutObservationIdempotencyKey } from './createShopifyCheckoutObservationIdempotencyKey'
import { createShopifyCheckoutObservationPayloadSha256 } from './createShopifyCheckoutObservationPayloadSha256'

const storedObservationSchema = z.strictObject({
  idempotencyKey: z.string().min(1).max(1024),
  payloadSha256: z.string().regex(/^[a-f0-9]{64}$/),
  observation: shopifyCheckoutObservationSchema,
  firstObservedAt: z.string().datetime({ offset: true }),
  lastObservedAt: z.string().datetime({ offset: true }),
  observationCount: z.number().int().positive()
})

const observationFileSchema = z.strictObject({
  storeVersion: z.literal(1),
  records: z.array(storedObservationSchema)
})

type ObservationFile = z.infer<typeof observationFileSchema>

export const DEFAULT_SHOPIFY_CHECKOUT_OBSERVATION_FILE = join(
  process.cwd(),
  '.development-data',
  'shopify-checkout-observations-v1.json'
)

export class ShopifyCheckoutObservationFileStore implements ShopifyCheckoutObservationStore {
  private operationQueue: Promise<unknown> = Promise.resolve()

  constructor(
    private readonly filePath = DEFAULT_SHOPIFY_CHECKOUT_OBSERVATION_FILE,
    private readonly now = () => new Date()
  ) {}

  persist(
    observation: ShopifyCheckoutObservation
  ): Promise<ShopifyCheckoutObservationWriteResult> {
    const operation = this.operationQueue.then(() =>
      this.persistSerialized(observation)
    )
    this.operationQueue = operation.catch(() => undefined)
    return operation
  }

  private async persistSerialized(
    observation: ShopifyCheckoutObservation
  ): Promise<ShopifyCheckoutObservationWriteResult> {
    const file = await this.readFile()
    const idempotencyKey =
      createShopifyCheckoutObservationIdempotencyKey(observation)
    const payloadSha256 =
      createShopifyCheckoutObservationPayloadSha256(observation)
    const existing = file.records.find(
      record => record.idempotencyKey === idempotencyKey
    )

    if (existing) {
      if (existing.payloadSha256 !== payloadSha256) {
        return {
          status: 'conflict',
          observationCount: existing.observationCount
        }
      }

      existing.lastObservedAt = this.now().toISOString()
      existing.observationCount += 1
      await this.writeFile(file)
      return {
        status: 'duplicate',
        observationCount: existing.observationCount
      }
    }

    const observedAt = this.now().toISOString()
    file.records.push({
      idempotencyKey,
      payloadSha256,
      observation,
      firstObservedAt: observedAt,
      lastObservedAt: observedAt,
      observationCount: 1
    })
    await this.writeFile(file)
    return { status: 'inserted', observationCount: 1 }
  }

  private async readFile(): Promise<ObservationFile> {
    try {
      const contents = await readFile(this.filePath, 'utf8')
      return observationFileSchema.parse(JSON.parse(contents))
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return { storeVersion: 1, records: [] }
      }

      throw error
    }
  }

  private async writeFile(file: ObservationFile) {
    const validatedFile = observationFileSchema.parse(file)
    const directory = dirname(this.filePath)
    const temporaryFile = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`
    await mkdir(directory, { recursive: true })
    await writeFile(
      temporaryFile,
      `${JSON.stringify(validatedFile, null, 2)}\n`,
      { encoding: 'utf8', flag: 'wx' }
    )
    await rename(temporaryFile, this.filePath)
  }
}
