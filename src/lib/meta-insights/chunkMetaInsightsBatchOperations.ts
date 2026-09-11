import {
  metaInsightsBatchLimit,
  type MetaInsightsBatchOperation
} from './buildMetaInsightsBatchOperations'

export function chunkMetaInsightsBatchOperations(
  operations: readonly MetaInsightsBatchOperation[]
) {
  const chunks: MetaInsightsBatchOperation[][] = []
  for (
    let index = 0;
    index < operations.length;
    index += metaInsightsBatchLimit
  ) {
    chunks.push(operations.slice(index, index + metaInsightsBatchLimit))
  }
  return chunks
}
