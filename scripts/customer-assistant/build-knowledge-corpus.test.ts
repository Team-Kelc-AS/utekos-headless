import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { buildAssistantKnowledgeDocuments } from '../../src/lib/google/customer-assistant/knowledgeManifest'
import { writeAssistantKnowledgeCorpus } from './build-knowledge-corpus'

test('writes a deterministic seven-document JSONL corpus to an injected path', async () => {
  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), 'utekos-assistant-corpus-')
  )
  const outputPath = join(
    temporaryDirectory,
    'nested',
    'documents.jsonl'
  )
  const logLines: string[] = []

  const summary = await writeAssistantKnowledgeCorpus(
    outputPath,
    line => {
      logLines.push(line)
    }
  )
  const artifact = await readFile(outputPath, 'utf8')
  const documents = artifact
    .trimEnd()
    .split('\n')
    .map(
      line =>
        JSON.parse(line) as { id: string; checksum: string }
    )
  const expected = buildAssistantKnowledgeDocuments()

  assert.equal(summary.documentCount, 7)
  assert.deepEqual(
    summary.ids,
    expected.map(document => document.id)
  )
  assert.deepEqual(
    summary.checksums,
    expected.map(document => document.checksum)
  )
  assert.equal(summary.byteSize, Buffer.byteLength(artifact))
  assert.deepEqual(documents, expected)
  assert.match(logLines.join('\n'), /Document count: 7/u)
  assert.match(
    logLines.join('\n'),
    /Ordered IDs: compare-models, comfyrobe-faq, shipping-returns, size-guide, materials, care, contact/u
  )
  assert.match(logLines.join('\n'), /Checksums:/u)
  assert.match(logLines.join('\n'), /Byte size: \d+/u)
})
