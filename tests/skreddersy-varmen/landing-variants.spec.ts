import { expect, test } from 'playwright/test'
import { encryptOverrides } from 'flags'

const landingUrl =
  process.env.SKREDDERSY_VARMEN_BASE_URL ??
  'http://localhost:3100/skreddersy-varmen'

// Overrides are confined to the disposable local browser context.
test.use({ trace: 'off', viewport: { width: 390, height: 844 } })

for (const variant of ['current', 'legacy']) {
  test(`keeps purchase and deferred OSM available in the ${variant} layout`, async ({
    page,
    context
  }) => {
    test.skip(
      !['localhost', '127.0.0.1'].includes(
        new URL(landingUrl).hostname
      ),
      'Local flag override test only'
    )
    test.skip(
      !process.env.FLAGS_SECRET,
      'Requires the existing local FLAGS_SECRET'
    )
    const override = await encryptOverrides(
      { 'skreddersy-varmen-layout-v1': variant },
      undefined,
      '10m'
    )
    await context.addCookies([
      {
        name: 'vercel-flag-overrides',
        value: override,
        url: landingUrl
      },
      {
        name: 'CookieConsent',
        value:
          '{necessary:true,preferences:false,statistics:true,marketing:false}',
        url: landingUrl
      },
      {
        name: '_ga',
        value: 'GA1.1.123456789.1234567890',
        url: landingUrl
      }
    ])
    await page.goto(landingUrl, { waitUntil: 'load' })
    await expect(
      page.locator('[data-experiment-variant]')
    ).toHaveAttribute('data-experiment-variant', variant)
    await expect(
      page.getByRole('button', { name: /^Legg i handlekurv/ })
    ).toBeEnabled()
    await expect(
      page.getByRole('radio', {
        name: 'Størrelse Stor',
        exact: true
      })
    ).toBeEnabled()
    await expect(
      page.locator('#klarna-on-site-messaging-websdk')
    ).toHaveAttribute('data-nscript', 'lazyOnload')
    await page
      .getByRole('button', {
        name: 'Størrelsestabell',
        exact: true
      })
      .click()
    await expect(
      page.getByRole('region', { name: 'Størrelsesveiledning' })
    ).toBeVisible()
  })
}
