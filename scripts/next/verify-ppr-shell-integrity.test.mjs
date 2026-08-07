import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_BASE_URL,
  normalizeBaseUrl,
  resolveBaseUrl,
  verifyPprShellIntegrity
} from './verify-ppr-shell-integrity.mjs'

const COMPLETE_HTML = [
  '<!doctype html>',
  '<html lang="no">',
  '<head><title>ok</title></head>',
  '<body>',
  '<script>self.__next_f.push([1,"0:null\\n"])</script>',
  '</body>',
  '</html>'
].join('')

const TRUNCATED_HTML = [
  '<!doctype html>',
  '<html lang="no">',
  '<head><title>bad</title></head>',
  '<body>',
  '<script>self.__next_f.push([1,"0:'
].join('')

function htmlResponse(
  body,
  {
    cache = 'MISS'
  } = {}
) {
  return new Response(body, {
    status: 200,
    headers: {
      'content-type':
        'text/html; charset=utf-8',
      'x-vercel-cache': cache
    }
  })
}

test(
  'normalizeBaseUrl adds https and strips path to origin',
  () => {
    assert.equal(
      normalizeBaseUrl(
        'example.vercel.app/some/path/'
      ),
      'https://example.vercel.app'
    )
  }
)

test(
  'normalizeBaseUrl uses http for localhost',
  () => {
    assert.equal(
      normalizeBaseUrl(
        'localhost:3000/path'
      ),
      'http://localhost:3000'
    )
  }
)

test(
  'resolveBaseUrl prefers CLI over environment',
  () => {
    assert.equal(
      resolveBaseUrl({
        args: [
          'https://preview.example.com'
        ],
        env: {
          PPR_SHELL_BASE_URL:
            'https://env.example.com'
        }
      }),
      'https://preview.example.com'
    )
  }
)

test(
  'resolveBaseUrl accepts --base-url',
  () => {
    assert.equal(
      resolveBaseUrl({
        args: [
          '--base-url',
          'preview.example.com'
        ],
        env: {}
      }),
      'https://preview.example.com'
    )
  }
)

test(
  'resolveBaseUrl falls back through Vercel deployment environment',
  () => {
    assert.equal(
      resolveBaseUrl({
        args: [],
        env: {
          VERCEL_URL:
            'utekos-headless-preview.vercel.app',
          VERCEL_PROJECT_PRODUCTION_URL:
            'utekos.no'
        }
      }),
      'https://utekos-headless-preview.vercel.app'
    )
  }
)

test(
  'resolveBaseUrl defaults to the production origin',
  () => {
    assert.equal(
      resolveBaseUrl({
        args: [],
        env: {}
      }),
      DEFAULT_BASE_URL
    )
  }
)

test(
  'verifyPprShellIntegrity observes every route twice',
  async () => {
    const calls = []

    const fetchImpl =
      async url => {
        calls.push(String(url))

        return htmlResponse(
          COMPLETE_HTML,
          {
            cache:
              calls.length % 2 === 0 ?
                'HIT'
              : 'MISS'
          }
        )
      }

    const report =
      await verifyPprShellIntegrity({
        baseUrl:
          'https://example.test',
        routes: [
          '/',
          '/produkter/comfyrobe'
        ],
        fetchImpl
      })

    assert.equal(
      report.ok,
      true
    )

    assert.equal(
      report.routeCount,
      2
    )

    assert.equal(
      report.observationCount,
      4
    )

    assert.equal(
      calls.length,
      4
    )

    assert.deepEqual(
      report.results.map(
        result => result.phase
      ),
      [
        'initial',
        'repeat',
        'initial',
        'repeat'
      ]
    )
  }
)

test(
  'verifyPprShellIntegrity rejects a truncated repeated shell',
  async () => {
    let callCount = 0

    const fetchImpl =
      async () => {
        callCount += 1

        if (callCount === 1) {
          return htmlResponse(
            COMPLETE_HTML,
            {
              cache: 'MISS'
            }
          )
        }

        return htmlResponse(
          TRUNCATED_HTML,
          {
            cache: 'HIT'
          }
        )
      }

    await assert.rejects(
      verifyPprShellIntegrity({
        baseUrl:
          'https://example.test',
        routes: [
          '/produkter/utekos-techdown'
        ],
        fetchImpl
      }),
      /phase=repeat/
    )
  }
)

test(
  'verifyPprShellIntegrity rejects cross-origin route syntax',
  async () => {
    await assert.rejects(
      verifyPprShellIntegrity({
        baseUrl:
          'https://example.test',
        routes: [
          '//evil.example/path'
        ],
        fetchImpl:
          async () =>
            htmlResponse(
              COMPLETE_HTML
            )
      }),
      /Route must be origin-relative/
    )
  }
)