import {
  handleMetaDatasetQualityCron,
  type MetaDatasetQualityCronDependencies
} from '../meta-dataset-quality/route'

export const maxDuration = 60

export function handleMetaDatasetQualityRetryCron(
  request: Request,
  dependencies?: MetaDatasetQualityCronDependencies
) {
  return handleMetaDatasetQualityCron(
    request,
    dependencies,
    'retry'
  )
}

export function GET(request: Request) {
  return handleMetaDatasetQualityRetryCron(request)
}
