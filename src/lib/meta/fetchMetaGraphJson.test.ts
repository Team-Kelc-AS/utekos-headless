import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'

import { z } from 'zod'

import {
  fetchMetaGraphJson,
  MetaGraphHttpError,
  type MetaGraphFetch
} from './fetchMetaGraphJson'

const responseSchema = z.object({ id: z.string() }).strip()

test('uses bearer auth and appsecret_proof without exposing credentials', async () => {
  const calls: Array<{ init: RequestInit; url: URL }> = []
  const fetchImplementation: MetaGraphFetch = async (
    input,
    init
  ) => {
    calls.push({ init, url: new URL(input) })
    return {
      json: async () => ({ id: '123' }),
      ok: true,
      status: 200
    }
  }
  const url = new URL('https://graph.facebook.com/v26.0/me')

  await fetchMetaGraphJson({
    accessToken: 'system-user-token',
    appSecret: 'app-secret',
    fetchImplementation,
    schema: responseSchema,
    url
  })

  assert.equal(calls.length, 1)
  assert.equal(url.searchParams.has('appsecret_proof'), false)
  assert.equal(
    calls[0]?.url.searchParams.has('access_token'),
    false
  )
  assert.equal(
    calls[0]?.url.searchParams.get('appsecret_proof'),
    createHmac('sha256', 'app-secret')
      .update('system-user-token', 'utf8')
      .digest('hex')
  )
  assert.doesNotMatch(
    calls[0]?.url.toString() ?? '',
    /system-user-token|app-secret/u
  )
  assert.deepEqual(calls[0]?.init.headers, {
    accept: 'application/json',
    authorization: 'Bearer system-user-token'
  })
  assert.equal(calls[0]?.init.cache, 'no-store')
  assert.equal(calls[0]?.init.method, 'GET')
})

test('rejects credentials embedded in request URLs', async () => {
  await assert.rejects(
    fetchMetaGraphJson({
      accessToken: 'system-user-token',
      fetchImplementation: async () => {
        throw new Error('must not call fetch')
      },
      schema: responseSchema,
      url: new URL(
        'https://graph.facebook.com/v26.0/me?access_token=system-user-token'
      )
    }),
    /credentials must not appear/u
  )
})

test('returns only structured provider error metadata', async () => {
  const accessToken = 'system-user-token'
  const fetchImplementation: MetaGraphFetch = async () => ({
    json: async () => ({
      error: {
        code: 190,
        error_subcode: 463,
        is_transient: false,
        message: `expired ${accessToken}`
      }
    }),
    ok: false,
    status: 401
  })

  await assert.rejects(
    fetchMetaGraphJson({
      accessToken,
      fetchImplementation,
      schema: responseSchema,
      url: new URL('https://graph.facebook.com/v26.0/me')
    }),
    error => {
      assert.ok(error instanceof MetaGraphHttpError)
      assert.equal(error.status, 401)
      assert.equal(error.code, 190)
      assert.equal(error.errorSubcode, 463)
      assert.equal(error.isTransient, false)
      assert.doesNotMatch(
        error.message,
        /expired|system-user-token/u
      )
      return true
    }
  )
})
