import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildAssistantKnowledgeDocuments } from '../../src/lib/google/customer-assistant/knowledgeManifest'

const DEFAULT_OUTPUT_PATH =
  '.agent-artifacts/customer-assistant/knowledge-documents.jsonl'

export type AssistantKnowledgeCorpusSummary = {
  documentCount: number
  ids: string[]
  checksums: string[]
  byteSize: number
}

export async function writeAssistantKnowledgeCorpus(
  outputPath = DEFAULT_OUTPUT_PATH,
  log: (line: string) => void = console.log
): Promise<AssistantKnowledgeCorpusSummary> {
  const documents = buildAssistantKnowledgeDocuments()
  const artifact = `${documents.map(document => JSON.stringify(document)).join('\n')}\n`

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, artifact, 'utf8')

  const summary = {
    documentCount: documents.length,
    ids: documents.map(document => document.id),
    checksums: documents.map(document => document.checksum),
    byteSize: Buffer.byteLength(artifact)
  }

  log(`Document count: ${summary.documentCount}`)
  log(`Ordered IDs: ${summary.ids.join(', ')}`)
  log(`Checksums: ${summary.checksums.join(', ')}`)
  log(`Byte size: ${summary.byteSize}`)

  return summary
}

const invokedPath =
  process.argv[1] ? resolve(process.argv[1]) : null
if (invokedPath === fileURLToPath(import.meta.url)) {
  void writeAssistantKnowledgeCorpus().catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}
