import { defineConfig, devices } from 'playwright/test'

const baseURL = 'http://localhost:3217'
const isProductionZeroProof =
  process.env.CUSTOMER_ASSISTANT_E2E_MODE === 'production-zero'
const assistantPreviewEnvironment = {
  CUSTOMER_ASSISTANT_ROLLOUT_PERCENT: '50',
  VERCEL_ENV: 'preview'
} as const

if (isProductionZeroProof) {
  delete process.env.CUSTOMER_ASSISTANT_ROLLOUT_PERCENT
  process.env.VERCEL_ENV = 'production'
} else {
  Object.assign(process.env, assistantPreviewEnvironment)
}

const assistantServerEnvironment = Object.fromEntries(
  Object.entries({
    ...process.env,
    ...(isProductionZeroProof ?
      { VERCEL_ENV: 'production' }
    : assistantPreviewEnvironment),
    NEXT_TELEMETRY_DISABLED: '1'
  }).filter((entry): entry is [string, string] => {
    return typeof entry[1] === 'string'
  })
)

export default defineConfig({
  testDir: './tests/customer-assistant',
  testMatch:
    isProductionZeroProof ?
      'customer-assistant-zero.spec.ts'
    : 'customer-assistant.spec.ts',
  outputDir:
    isProductionZeroProof ?
      './output/playwright/assistant-production-zero'
    : './output/playwright/assistant-preview',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  preserveOutput: 'always',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    locale: 'nb-NO',
    timezoneId: 'Europe/Oslo',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off'
  },
  webServer: {
    command:
      isProductionZeroProof ?
        'pnpm exec next start --hostname 127.0.0.1 --port 3217'
      : 'pnpm exec next dev --hostname 127.0.0.1 --port 3217',
    url: baseURL,
    env: assistantServerEnvironment,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
    gracefulShutdown: { signal: 'SIGTERM', timeout: 1_000 }
  }
})
