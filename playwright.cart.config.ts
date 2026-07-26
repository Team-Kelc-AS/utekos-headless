import { defineConfig, devices } from 'playwright/test'

const baseURL = 'http://127.0.0.1:3218'
const chromeExecutablePath =
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE_PATH

const serverEnvironment = Object.fromEntries(
  Object.entries({
    ...process.env,
    NEXT_TELEMETRY_DISABLED: '1',
    VERCEL_ENV: 'preview'
  }).filter((entry): entry is [string, string] => {
    return typeof entry[1] === 'string'
  })
)

export default defineConfig({
  testDir: './tests/cart',
  outputDir: './output/playwright/cart',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  preserveOutput: 'always',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    locale: 'nb-NO',
    timezoneId: 'Europe/Oslo',
    viewport: { width: 1440, height: 900 },
    ...(chromeExecutablePath ?
      {
        launchOptions: {
          executablePath: chromeExecutablePath
        }
      }
    : {}),
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off'
  },
  webServer: {
    command:
      'pnpm exec next dev --hostname 127.0.0.1 --port 3218',
    url: baseURL,
    env: serverEnvironment,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
    gracefulShutdown: { signal: 'SIGTERM', timeout: 1_000 }
  }
})
