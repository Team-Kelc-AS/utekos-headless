/** Remove the test line from the smoke's fresh, isolated browser context. */
export async function cleanupMetaSmokeCart(sourcePage, baseUrl) {
  // Checkout interception can leave the measured page on a browser error page.
  // Reuse only this smoke's cookies in a new page, without its navigation guard.
  const page = await sourcePage.context().newPage()
  try {
    await page.goto(new URL('/', baseUrl).toString(), {
      waitUntil: 'domcontentloaded',
      timeout: 30_000
    })
    if (new URL(page.url()).origin !== new URL(baseUrl).origin) {
      throw new Error('Cannot clean the test cart outside the storefront')
    }

    await page
      .getByRole('button', { name: /^Åpne handlekurven/ })
      .first()
      .click({ timeout: 15_000 })
    const remove = page.locator('[data-track="CartRemoveItemOpen"]')
    await remove.first().waitFor({ state: 'visible', timeout: 15_000 })
    if ((await remove.count()) !== 1) {
      throw new Error('Expected exactly one isolated smoke cart line')
    }

    await remove.click({ timeout: 10_000 })
    await page
      .locator('[data-track="CartRemoveItem"]')
      .click({ timeout: 10_000 })
    await remove.waitFor({ state: 'detached', timeout: 15_000 })
    return { status: 'removed_in_ui' }
  } finally {
    await page.close()
  }
}
