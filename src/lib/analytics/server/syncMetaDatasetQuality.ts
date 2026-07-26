import {
  fetchMetaDatasetQuality,
  readMetaDatasetQualityConfig,
  type MetaDatasetQualityConfig
} from './fetchMetaDatasetQuality'
import {
  insertMetaDatasetQualitySnapshot,
  type MetaDatasetQualitySnapshotInput
} from './insertMetaDatasetQualitySnapshot'
import type { MetaDatasetQualityResponse } from './metaDatasetQualitySchema'
import {
  requiredMetaDatasetQualityEvents,
  type RequiredMetaDatasetQualityEvent
} from '../metaDatasetQualityRequiredEvents'

export type { RequiredMetaDatasetQualityEvent } from '../metaDatasetQualityRequiredEvents'

export type MetaDatasetQualitySyncResult = {
  complete: boolean
  datasetId: string
  eventCount: number
  insertedCount: number
  measuredAt: string
  missingRequiredEvents: RequiredMetaDatasetQualityEvent[]
}

export type MetaDatasetQualitySyncDependencies = {
  fetchQuality: (
    config: MetaDatasetQualityConfig
  ) => Promise<MetaDatasetQualityResponse>
  getConfig: () => MetaDatasetQualityConfig
  getNow: () => Date
  insertSnapshot: (
    input: MetaDatasetQualitySnapshotInput
  ) => Promise<number>
}

const defaultDependencies: MetaDatasetQualitySyncDependencies = {
  fetchQuality: fetchMetaDatasetQuality,
  getConfig: readMetaDatasetQualityConfig,
  getNow: () => new Date(),
  insertSnapshot: insertMetaDatasetQualitySnapshot
}

export async function syncMetaDatasetQuality(
  dependencies: MetaDatasetQualitySyncDependencies = defaultDependencies
): Promise<MetaDatasetQualitySyncResult> {
  const config = dependencies.getConfig()
  const quality = await dependencies.fetchQuality(config)
  const measuredAt = dependencies.getNow()
  const eventNames = new Set(
    quality.web.map(event => event.event_name)
  )
  const missingRequiredEvents = requiredMetaDatasetQualityEvents.filter(
    eventName => !eventNames.has(eventName)
  )
  const insertedCount = await dependencies.insertSnapshot({
    datasetId: config.datasetId,
    events: quality.web,
    measuredAt
  })

  return {
    complete: missingRequiredEvents.length === 0,
    datasetId: config.datasetId,
    eventCount: quality.web.length,
    insertedCount,
    measuredAt: measuredAt.toISOString(),
    missingRequiredEvents
  }
}
