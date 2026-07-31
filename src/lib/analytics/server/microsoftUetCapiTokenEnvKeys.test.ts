import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MICROSOFT_UET_CAPI_TOKEN_ENV_KEYS,
  resolveMicrosoftUetCapiTokenFromEnv
} from './microsoftUetCapiTokenEnvKeys'

function withEnv(
  overrides: Record<string, string | undefined>,
  run: () => void
) {
  const previous = Object.fromEntries(
    MICROSOFT_UET_CAPI_TOKEN_ENV_KEYS.map(key => [key, process.env[key]])
  )

  for (const key of MICROSOFT_UET_CAPI_TOKEN_ENV_KEYS) {
    delete process.env[key]
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

  try {
    run()
  } finally {
    for (const key of MICROSOFT_UET_CAPI_TOKEN_ENV_KEYS) {
      const value = previous[key]

      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

test('resolveMicrosoftUetCapiTokenFromEnv prefers ACCESS_TOKEN alias', () => {
  withEnv(
    {
      MICROSOFT_UET_CAPI_ACCESS_TOKEN: 'access-alias-token',
      MICROSOFT_UET_CAPI_TOKEN: 'legacy-token'
    },
    () => {
      assert.equal(
        resolveMicrosoftUetCapiTokenFromEnv(),
        'access-alias-token'
      )
    }
  )
})

test('resolveMicrosoftUetCapiTokenFromEnv falls back through aliases', () => {
  withEnv(
    {
      MICROSOFT_ADS_UET_CAPI_TOKEN: 'ads-uet-token'
    },
    () => {
      assert.equal(
        resolveMicrosoftUetCapiTokenFromEnv(),
        'ads-uet-token'
      )
    }
  )
})
