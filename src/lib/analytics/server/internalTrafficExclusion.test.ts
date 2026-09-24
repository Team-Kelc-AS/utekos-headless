import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  isInternalTrafficEvent,
  readInternalTrafficIpAllowlist
} from './internalTrafficExclusion'

test('excludes non-production environments', () => {
  for (const environment of ['development', 'preview']) {
    assert.equal(
      isInternalTrafficEvent({ environment }),
      true
    )
  }
  // 'test' is the neutral unit-test fixture default and never occurs in
  // production runtime, so it must not trigger the gate.
  for (const environment of ['production', 'test', undefined]) {
    assert.equal(
      isInternalTrafficEvent({ environment }),
      false
    )
  }
})

test('excludes localhost page urls even without environment', () => {
  for (const pageUrl of [
    'http://localhost:3000/produkter/techdown',
    'http://127.0.0.1:3000/',
    'http://[::1]:3000/',
    'http://utekos.local/produkter'
  ]) {
    assert.equal(
      isInternalTrafficEvent({ page_url: pageUrl }),
      true
    )
  }
  assert.equal(
    isInternalTrafficEvent({
      page_url: 'https://utekos.no/produkter'
    }),
    false
  )
})

test('matches allowlisted ips and cidr ranges', () => {
  const env = {
    INTERNAL_TRAFFIC_IPS: '84.48.12.34, 158.36.0.0/16'
  }
  assert.equal(
    isInternalTrafficEvent(
      {
        client_ip_address: '84.48.12.34',
        environment: 'production'
      },
      env
    ),
    true
  )
  assert.equal(
    isInternalTrafficEvent(
      {
        client_ip_address: '158.36.200.11',
        environment: 'production'
      },
      env
    ),
    true
  )
  assert.equal(
    isInternalTrafficEvent(
      {
        client_ip_address: '158.37.0.1',
        environment: 'production'
      },
      env
    ),
    false
  )
  assert.equal(
    isInternalTrafficEvent(
      {
        client_ip_address: '84.48.12.34',
        environment: 'production'
      },
      {}
    ),
    false
  )
})

test('reads the allowlist without whitespace noise', () => {
  assert.deepEqual(
    readInternalTrafficIpAllowlist({
      INTERNAL_TRAFFIC_IPS: ' 84.48.12.34 ,,158.36.0.0/16,'
    }),
    ['84.48.12.34', '158.36.0.0/16']
  )
  assert.deepEqual(readInternalTrafficIpAllowlist({}), [])
})
