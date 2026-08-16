import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import {
  brotliCompressSync,
  deflateSync,
  gunzipSync,
  gzipSync
} from 'node:zlib'
import test from 'node:test'

const require = createRequire(import.meta.url)

const {
  decompressBody
} = require('next/dist/server/lib/postponed-request-body.js')

const {
  parsePostponedState
} = require('next/dist/server/app-render/postponed-state.js')

const SAFE_DYNAMIC_DATA_FALLBACK = '4:nullnull'

function postponedState(length = 12) {
  const payload = 'x'.repeat(length)

  return Buffer.from(
    `${length}:${payload}null`,
    'utf8'
  )
}

function withCapturedWarnings(callback) {
  const warnings = []
  const originalWarn = console.warn

  console.warn = (...args) => warnings.push(args)

  try {
    return {
      result: callback(),
      warnings
    }
  } finally {
    console.warn = originalWarn
  }
}

function assertSafeDynamicDataFallback(result) {
  assert.equal(
    result.toString('utf8'),
    SAFE_DYNAMIC_DATA_FALLBACK
  )

  const parsed = parsePostponedState(
    result.toString('utf8'),
    {},
    1024 * 1024
  )

  assert.equal(parsed.type, 1)
  assert.equal(parsed.renderResumeDataCache.cache.size, 0)
  assert.equal(parsed.renderResumeDataCache.fetch.size, 0)
  assert.equal(
    parsed.renderResumeDataCache.encryptedBoundArgs.size,
    0
  )
  assert.equal(
    parsed.renderResumeDataCache.decryptedBoundArgs.size,
    0
  )
}

function assertSafeFallbackWarning(warnings) {
  assert.equal(warnings.length, 1)

  assert.match(
    String(warnings[0][0]),
    /safe dynamic-data fallback/
  )
}

test(
  'decompressBody returns uncompressed postponed state unchanged',
  () => {
    const body = postponedState()

    const result = decompressBody(
      body,
      undefined,
      1024 * 1024
    )

    assert.equal(Buffer.compare(result, body), 0)
  }
)

test(
  'decompressBody gunzips complete bodies with gzip magic and no header',
  () => {
    const plaintext = postponedState(24)
    const compressed = gzipSync(plaintext)

    const result = decompressBody(
      compressed,
      undefined,
      1024 * 1024
    )

    assert.equal(
      result.toString('utf8'),
      plaintext.toString('utf8')
    )
  }
)

test(
  'decompressBody gunzips complete bodies with Content-Encoding gzip',
  () => {
    const plaintext = postponedState(18)
    const compressed = gzipSync(plaintext)

    const result = decompressBody(
      compressed,
      'gzip',
      1024 * 1024
    )

    assert.equal(
      result.toString('utf8'),
      plaintext.toString('utf8')
    )
  }
)

test(
  'decompressBody decodes Brotli when Content-Encoding is br',
  () => {
    const plaintext = postponedState(28)
    const compressed = brotliCompressSync(plaintext)

    const result = decompressBody(
      compressed,
      'br',
      1024 * 1024
    )

    assert.equal(
      result.toString('utf8'),
      plaintext.toString('utf8')
    )
  }
)

test(
  'decompressBody decodes deflate when Content-Encoding is deflate',
  () => {
    const plaintext = postponedState(30)
    const compressed = deflateSync(plaintext)

    const result = decompressBody(
      compressed,
      ['DEFLATE'],
      1024 * 1024
    )

    assert.equal(
      result.toString('utf8'),
      plaintext.toString('utf8')
    )
  }
)

test(
  'decompressBody decodes stacked gzip then Brotli encodings in reverse order',
  () => {
    const plaintext = postponedState(36)

    const compressed = brotliCompressSync(
      gzipSync(plaintext)
    )

    const result = decompressBody(
      compressed,
      'gzip, br',
      1024 * 1024
    )

    assert.equal(
      result.toString('utf8'),
      plaintext.toString('utf8')
    )
  }
)

test(
  'decompressBody decodes stacked Brotli then gzip header arrays',
  () => {
    const plaintext = postponedState(38)

    const compressed = gzipSync(
      brotliCompressSync(plaintext)
    )

    const result = decompressBody(
      compressed,
      ['br', 'gzip'],
      1024 * 1024
    )

    assert.equal(
      result.toString('utf8'),
      plaintext.toString('utf8')
    )
  }
)

test(
  'decompressBody returns an empty body unchanged',
  () => {
    const body = Buffer.alloc(0)

    const result = decompressBody(
      body,
      undefined,
      1024 * 1024
    )

    assert.equal(Buffer.compare(result, body), 0)
  }
)

test(
  'decompressBody recovers gzip with a truncated trailer',
  () => {
    const plaintext = postponedState(64)
    const compressed = gzipSync(plaintext)

    const truncated = compressed.subarray(
      0,
      compressed.length - 8
    )

    assert.throws(
      () => gunzipSync(truncated),
      {
        code: 'Z_BUF_ERROR'
      }
    )

    const { result, warnings } =
      withCapturedWarnings(() =>
        decompressBody(
          truncated,
          undefined,
          1024 * 1024
        )
      )

    assert.equal(
      result.toString('utf8'),
      plaintext.toString('utf8')
    )

    assert.equal(warnings.length, 1)

    assert.match(
      String(warnings[0][0]),
      /truncated trailer/
    )

    assert.equal(
      warnings[0][1].activeEncoding,
      'gzip'
    )
  }
)

test(
  'decompressBody fails closed when only 1-7 gzip trailer bytes are missing',
  () => {
    const compressed = gzipSync(
      postponedState(72)
    )

    for (
      let missingBytes = 1;
      missingBytes <= 7;
      missingBytes++
    ) {
      const truncated = compressed.subarray(
        0,
        compressed.length - missingBytes
      )

      assert.throws(
        () => gunzipSync(truncated),
        {
          code: 'Z_BUF_ERROR'
        }
      )

      const { result, warnings } =
        withCapturedWarnings(() =>
          decompressBody(
            truncated,
            'gzip',
            1024 * 1024
          )
        )

      assertSafeDynamicDataFallback(result)
      assertSafeFallbackWarning(warnings)

      assert.equal(
        warnings[0][1].activeEncoding,
        'gzip'
      )
    }
  }
)

test(
  'decompressBody recovers truncated gzip despite a mismatched header',
  () => {
    const plaintext = postponedState(48)

    const compressed = gzipSync(plaintext)

    const truncated = compressed.subarray(
      0,
      compressed.length - 8
    )

    assert.throws(
      () => gunzipSync(truncated),
      {
        code: 'Z_BUF_ERROR'
      }
    )

    const { result, warnings } =
      withCapturedWarnings(() =>
        decompressBody(
          truncated,
          'deflate',
          1024 * 1024
        )
      )

    assert.equal(
      result.toString('utf8'),
      plaintext.toString('utf8')
    )

    assert.equal(warnings.length, 1)

    assert.match(
      String(warnings[0][0]),
      /truncated trailer/
    )
  }
)

test(
  'decompressBody fails closed when gzip is truncated inside the deflate stream',
  () => {
    const compressed = gzipSync(
      postponedState(4096)
    )

    const truncated = compressed.subarray(
      0,
      compressed.length - 20
    )

    assert.throws(
      () => gunzipSync(truncated),
      {
        code: 'Z_BUF_ERROR'
      }
    )

    const { result, warnings } =
      withCapturedWarnings(() =>
        decompressBody(
          truncated,
          'gzip',
          1024 * 1024
        )
      )

    assertSafeDynamicDataFallback(result)
    assertSafeFallbackWarning(warnings)

    assert.equal(
      warnings[0][1].activeEncoding,
      'gzip'
    )
  }
)

test(
  'decompressBody ignores stale gzip Content-Encoding when gzip magic is absent',
  () => {
    const body = postponedState(20)

    const result = decompressBody(
      body,
      'gzip',
      1024 * 1024
    )

    assert.equal(
      Buffer.compare(result, body),
      0
    )
  }
)

test(
  'decompressBody never forwards corrupt gzip bytes to the postponed-state parser',
  () => {
    const body = Buffer.from([
      0x1f,
      0x8b,
      0x00,
      0xff,
      0x00
    ])

    const { result, warnings } =
      withCapturedWarnings(() =>
        decompressBody(
          body,
          'gzip',
          1024 * 1024
        )
      )

    assert.notEqual(
      Buffer.compare(result, body),
      0
    )

    assertSafeDynamicDataFallback(result)
    assertSafeFallbackWarning(warnings)

    assert.equal(
      warnings[0][1].activeEncoding,
      'gzip'
    )
  }
)

test(
  'decompressBody fails closed with controlled diagnostics for invalid Brotli',
  () => {
    const body = Buffer.from(
      'not-brotli',
      'utf8'
    )

    const { result, warnings } =
      withCapturedWarnings(() =>
        decompressBody(
          body,
          'br',
          1024 * 1024
        )
      )

    assertSafeDynamicDataFallback(result)
    assertSafeFallbackWarning(warnings)

    assert.equal(
      warnings[0][1].contentEncoding,
      'br'
    )

    assert.equal(
      warnings[0][1].activeEncoding,
      'br'
    )
  }
)

test(
  'decompressBody fails closed when decompressed output exceeds the configured limit',
  () => {
    const compressed = gzipSync(
      postponedState(4096)
    )

    const { result, warnings } =
      withCapturedWarnings(() =>
        decompressBody(
          compressed,
          'gzip',
          64
        )
      )

    assertSafeDynamicDataFallback(result)
    assertSafeFallbackWarning(warnings)
  }
)

test(
  'safe fallback is a valid Next dynamic-data postponed state',
  () => {
    const fallback = Buffer.from(
      SAFE_DYNAMIC_DATA_FALLBACK,
      'utf8'
    )

    assertSafeDynamicDataFallback(fallback)
  }
)

test(
  'gzip postponed state can be decoded without consuming the following action body',
  () => {
    const postponed = postponedState(64)

    const compressedPostponed =
      gzipSync(postponed)

    const actionBody = Buffer.from(
      '------next-action\r\n' +
        'Content-Disposition: form-data; name="0"\r\n' +
        '\r\n' +
        '[]\r\n',
      'utf8'
    )

    const combinedBody = Buffer.concat([
      compressedPostponed,
      actionBody
    ])

    const stateLength =
      compressedPostponed.length

    const decodedPostponed =
      decompressBody(
        combinedBody.subarray(
          0,
          stateLength
        ),
        'gzip',
        1024 * 1024
      )

    const preservedActionBody =
      combinedBody.subarray(stateLength)

    assert.equal(
      decodedPostponed.toString('utf8'),
      postponed.toString('utf8')
    )

    assert.equal(
      Buffer.compare(
        preservedActionBody,
        actionBody
      ),
      0
    )
  }
)

test(
  'server actions split the raw action body before decompressing postponed state',
  () => {
    const templatePath =
      require.resolve(
        'next/dist/build/templates/app-page-runtime.js'
      )

    const template =
      readFileSync(templatePath, 'utf8')

    assert.match(
      template,
      /const compressedPostponedState = fullBody\.subarray\(0, stateLength\)/
    )

    assert.match(
      template,
      /decompressBody\)\(compressedPostponedState, req\.headers\['content-encoding'\]/
    )

    assert.match(
      template,
      /const actionBody = fullBody\.subarray\(stateLength\)/
    )

    assert.doesNotMatch(
      template,
      /decompressBody\)\(fullBody, req\.headers\['content-encoding'\]/
    )
  }
)