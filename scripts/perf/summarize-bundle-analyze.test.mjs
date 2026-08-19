import assert from 'node:assert/strict'
import test from 'node:test'
import {
  extractFirstJsonObject,
  formatBytes,
  neighbors,
  parseAdjacencyList,
  resolveSourcePath
} from './summarize-bundle-analyze.mjs'

test('extractFirstJsonObject stops before trailing binary', () => {
  const json = Buffer.from('{"modules":[{"ident":"a","path":"a"}]}', 'utf8')
  const blob = Buffer.from([0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x00])
  const prefix = Buffer.from([0x00, 0x00, 0x00, json.length])
  const parsed = extractFirstJsonObject(Buffer.concat([prefix, json, blob]))
  assert.deepEqual(parsed.value, {
    modules: [{ ident: 'a', path: 'a' }]
  })
  assert.deepEqual(parsed.blob, blob)
})

test('parseAdjacencyList reads big-endian CSR neighbors', () => {
  const nodeCount = 3
  const integers = [
    nodeCount,
    0,
    1,
    2,
    1,
    2
  ]
  const blob = Buffer.alloc(integers.length * 4)
  integers.forEach((value, index) => {
    blob.writeUInt32BE(value, index * 4)
  })

  const graph = parseAdjacencyList(
    blob,
    { offset: 0, length: blob.length },
    nodeCount
  )

  assert.deepEqual(neighbors(0, graph), [1])
  assert.deepEqual(neighbors(1, graph), [2])
  assert.deepEqual(neighbors(2, graph), [])
})

test('resolveSourcePath walks parent_source_index', () => {
  const sources = [
    { path: 'index.js', parent_source_index: 1 },
    { path: 'crypto-browserify/', parent_source_index: 2 },
    { path: 'compiled/' }
  ]
  assert.equal(
    resolveSourcePath(sources, 0),
    'compiled/crypto-browserify/index.js'
  )
})

test('formatBytes matches the analyzer UI kibibyte display', () => {
  assert.equal(formatBytes(202710), '197.96 KB')
  assert.equal(formatBytes(655240), '639.88 KB')
})
