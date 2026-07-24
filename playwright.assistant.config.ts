import { defineConfig, devices } from 'playwright/test'

const baseURL = 'http://localhost:3217'
const assistantPreviewEnvironment = {
  CUSTOMER_ASSISTANT_ROLLOUT_PERCENT: '100',
  VERCEL_ENV: 'preview'
} as const

Object.assign(process.env, assistantPreviewEnvironment)

export default defineConfig({
  testDir: './tests/customer-assistant',
  outputDir: './output/playwright/test-results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
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
      'pnpm exec next dev --hostname 127.0.0.1 --port 3217',
    url: baseURL,
    env: {
      ...process.env,
      ...assistantPreviewEnvironment,
      NEXT_TELEMETRY_DISABLED: '1'
    },
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
    gracefulShutdown: { signal: 'SIGTERM', timeout: 1_000 }
  }
})
