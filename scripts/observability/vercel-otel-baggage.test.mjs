import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import test from 'node:test'

const require = createRequire(import.meta.url)
const nodeEntry = pathToFileURL(require.resolve('@vercel/otel'))

function runScenario(runtime, scenario) {
  const entry = runtime === 'node'
    ? nodeEntry
    : new URL('../edge/index.js', nodeEntry)
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict'
    import {
      ROOT_CONTEXT, propagation, trace, defaultTextMapGetter
    } from '@opentelemetry/api'
    const { registerOTel } = await import(${JSON.stringify(entry.href)})
    registerOTel({
      serviceName: 'utekos-baggage-regression-test',
      instrumentations: [],
      spanProcessors: []
    })
    const extract = baggage => propagation.getBaggage(
      propagation.extract(ROOT_CONTEXT, { baggage }, defaultTextMapGetter)
    )?.getAllEntries() ?? []
    ${scenario}
  `], { encoding: 'utf8', timeout: 10000 })

  assert.equal(result.error, undefined)
  assert.equal(result.status, 0, result.stderr || result.stdout)
}

// The package bundles separate parsers for Node and Edge. Exercise its real
// default propagators in fresh processes so global OTel registration cannot
// make one runtime's tests accidentally use the other runtime's parser.
for (const runtime of ['node', 'edge']) {
  test(`${runtime}: preserves normal baggage values and metadata`, () => {
    runScenario(runtime, `
      const entries = extract('customer=hello%20world;source=checkout')
      assert.equal(entries.length, 1)
      assert.equal(entries[0][0], 'customer')
      assert.equal(entries[0][1].value, 'hello world')
      assert.equal(entries[0][1].metadata.toString(), 'source=checkout')
    `)
  })

  test(`${runtime}: bounds a single baggage header to 180 entries`, () => {
    runScenario(runtime, `
      const header = Array.from({ length: 500 }, (_, i) => 'key' + i + '=value').join(',')
      const entries = extract(header)
      assert.equal(entries.length, 180)
      assert.equal(entries.at(-1)[0], 'key179')
    `)
  })

  test(`${runtime}: shares the entry limit across repeated headers`, () => {
    runScenario(runtime, `
      const headers = Array.from({ length: 500 }, (_, i) => 'key' + i + '=value')
      assert.equal(extract(headers).length, 180)
    `)
  })

  test(`${runtime}: skips oversized entries while retaining ordinary entries`, () => {
    runScenario(runtime, `
      const header = 'oversized=' + 'x'.repeat(100000) + ',ordinary=kept'
      assert.deepEqual(extract(header), [['ordinary', { value: 'kept' }]])
    `)
  })

  test(`${runtime}: enforces the total 8192-byte budget for a string`, () => {
    runScenario(runtime, `
      const header = ['a', 'b', 'c'].map(key => key + '=' + 'x'.repeat(3000)).join(',')
      assert.equal(extract(header).length, 2)
    `)
  })

  test(`${runtime}: shares the total budget across repeated headers`, () => {
    runScenario(runtime, `
      const headers = ['a', 'b', 'c'].map(key => key + '=' + 'x'.repeat(3000))
      assert.equal(extract(headers).length, 2)
    `)
  })

  test(`${runtime}: counts accepted duplicate keys toward the parsing limit`, () => {
    runScenario(runtime, `
      const header = Array.from({ length: 500 }, (_, i) => 'same=' + i).join(',')
      assert.deepEqual(extract(header), [['same', { value: '179' }]])
    `)
  })

  test(`${runtime}: keeps trace context propagation alongside bounded baggage`, () => {
    runScenario(runtime, `
      const ctx = propagation.extract(ROOT_CONTEXT, {
        traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
        baggage: 'customer=known'
      }, defaultTextMapGetter)
      assert.equal(trace.getSpanContext(ctx).traceId, '0123456789abcdef0123456789abcdef')
      assert.equal(propagation.getBaggage(ctx).getEntry('customer').value, 'known')
      assert.deepEqual(propagation.fields(), ['traceparent', 'tracestate', 'baggage'])
    `)
  })
}
