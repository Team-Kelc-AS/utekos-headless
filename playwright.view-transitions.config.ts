import { defineConfig, devices } from 'playwright/test'

const baseURL = 'http://localhost:3218'
const isProductionBuild =
  process.env.VIEW_TRANSITIONS_E2E_MODE === 'production'
const serverEnvironment = Object.fromEntries(
  Object.entries({
    ...process.env,
    VERCEL_ENV: 'preview',
    MAGAZINE_VIEW_TRANSITIONS_PREVIEW_ENABLED: '1',
    NEXT_TELEMETRY_DISABLED: '1'
  }).filter((entry): entry is [string, string] => {
    return typeof entry[1] === 'string'
  })
)

export default defineConfig({
  testDir: './tests/view-transitions',
  outputDir:
    isProductionBuild ?
      './output/playwright/view-transitions-production'
    : './output/playwright/view-transitions',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  preserveOutput: 'always',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL,
    locale: 'nb-NO',
    timezoneId: 'Europe/Oslo',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off'
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] }
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] }
    }
  ],
  webServer: {
    command:
      isProductionBuild ?
        'pnpm exec next start --hostname 127.0.0.1 --port 3218'
      : 'pnpm exec next dev --hostname 127.0.0.1 --port 3218',
    url: baseURL,
    env: serverEnvironment,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
    gracefulShutdown: { signal: 'SIGTERM', timeout: 1_000 }
  }
})
