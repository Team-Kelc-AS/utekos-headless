import { expect, test, type Route } from 'playwright/test'

const landingUrl =
  process.env.SKREDDERSY_VARMEN_BASE_URL ??
  'http://localhost:3100/skreddersy-varmen'

test('accepts the first hero CTA click on a slow connection', async ({
  page,
  context
}) => {
  test.setTimeout(45_000)
  await page.setViewportSize({ width: 390, height: 844 })
  const session = await context.newCDPSession(page)
  await session.send('Emulation.setCPUThrottlingRate', {
    rate: 4
  })
  await session.send('Network.emulateNetworkConditionsByRule', {
    matchedNetworkConditions: [
      {
        urlPattern: '',
        latency: 150,
        downloadThroughput: 200_000,
        uploadThroughput: 93_750
      }
    ]
  })
  await page.goto(landingUrl, { waitUntil: 'domcontentloaded' })
  await page
    .locator('[data-track="HeroCtaSkreddersyVarmen"]')
    .click()
  await expect
    .poll(
      () =>
        page.locator('#purchase-section').evaluate(element => {
          const top = element.getBoundingClientRect().top
          const nativeOffset = parseFloat(
            getComputedStyle(element).scrollMarginTop
          )
          return Math.min(
            Math.abs(top - 72),
            Math.abs(top - nativeOffset)
          )
        }),
      { timeout: 10_000 }
    )
    .toBeLessThanOrEqual(1)
  await expect(
    page.getByRole('radio', {
      name: 'Størrelse Stor',
      exact: true
    })
  ).toBeEnabled()
})

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 }
]) {
  test(`prioritizes only the matching hero and keeps purchase ready at ${viewport.width}px`, async ({
    page
  }) => {
    await page.setViewportSize(viewport)
    const pageErrors: string[] = []
    page.on('pageerror', error => pageErrors.push(error.message))
    await page.goto(landingUrl, { waitUntil: 'load' })

    const hero = page.locator('[class*="heroMedia"] img')
    const expectedImage =
      viewport.width < 768 ?
        'skreddersy-varmen-hero-mobile'
      : 'cinema-twilight'
    const otherImage =
      viewport.width < 768 ?
        'cinema-twilight'
      : 'skreddersy-varmen-hero-mobile'
    await expect(hero).toHaveAttribute('loading', 'eager')
    await expect(hero).toHaveAttribute('fetchpriority', 'high')
    await expect
      .poll(() =>
        hero.evaluate(
          image => (image as HTMLImageElement).currentSrc
        )
      )
      .toContain(expectedImage)
    const imageRequests = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .map(entry => decodeURIComponent(entry.name))
    )
    expect(
      imageRequests.some(url => url.includes(expectedImage))
    ).toBe(true)
    expect(
      imageRequests.some(url => url.includes(otherImage))
    ).toBe(false)

    const gallery = page.locator('[data-landing-gallery]')
    await expect(gallery).toHaveAttribute(
      'data-landing-gallery',
      'initial'
    )
    await expect(gallery.locator('img')).toHaveCount(1)
    await expect(gallery.locator('img')).toHaveAttribute(
      'loading',
      'lazy'
    )
    await expect(
      page.getByRole('radio', {
        name: 'Størrelse Middels',
        exact: true
      })
    ).toBeEnabled()
    await expect(
      page.getByRole('button', { name: /^Legg i handlekurv/ })
    ).toBeEnabled()

    const initialVisibility = await page.evaluate(() => {
      const selectors = [
        '[class*="heroMedia"]',
        '[class*="heroContent"]',
        ...(window.innerWidth >= 1024 ?
          [
            '[data-header-part="brand"]',
            '[data-header-part="actions"]'
          ]
        : [])
      ]
      return selectors.map(selector => {
        const element = document.querySelector(selector)!
        const style = getComputedStyle(element)
        return {
          selector,
          animationName: style.animationName,
          opacity: style.opacity,
          visibility: style.visibility
        }
      })
    })
    for (const element of initialVisibility) {
      expect(element.animationName, element.selector).toBe(
        'none'
      )
      expect(element.opacity, element.selector).toBe('1')
      expect(element.visibility, element.selector).toBe(
        'visible'
      )
    }
    expect(pageErrors).toEqual([])
  })
}

test('keeps the gallery usable and stable while its optional module is delayed', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(landingUrl, { waitUntil: 'load' })
  const gallery = page.locator('[data-landing-gallery]')
  await expect(gallery).toHaveAttribute(
    'data-landing-gallery',
    'initial'
  )
  const initialHeight = await gallery.evaluate(
    element => element.getBoundingClientRect().height
  )
  const heldRequests: Route[] = []
  let hold = true
  const delayOptionalChunks = async (route: Route) => {
    if (hold) heldRequests.push(route)
    else await route.continue()
  }
  await page.route(
    '**/_next/static/chunks/**',
    delayOptionalChunks
  )

  try {
    const next = gallery.getByRole('button', {
      name: 'Neste bilde',
      exact: true
    })
    await next.click()
    await expect(gallery).toHaveAttribute(
      'data-landing-gallery',
      'initial'
    )
    await expect(gallery.locator('img')).toHaveAttribute(
      'alt',
      /skrått forfra/
    )
    await expect(next).toBeFocused()
    await next.press('ArrowRight')
    await expect(gallery.locator('img')).toHaveAttribute(
      'alt',
      /sett bakfra/
    )
    await expect
      .poll(() => heldRequests.length)
      .toBeGreaterThan(0)

    hold = false
    await Promise.all(
      heldRequests.map(route => route.continue())
    )
    await page.unroute(
      '**/_next/static/chunks/**',
      delayOptionalChunks
    )
    // Loading must not replace a focused control or reset the selected image.
    await expect(next).toBeFocused()
    await next.evaluate(element => element.blur())
    await expect(gallery).toHaveAttribute(
      'data-landing-gallery',
      'enhanced'
    )
    await expect(
      gallery.locator('[data-slot="carousel-item"]').nth(2)
    ).toHaveCSS('opacity', '1')
    const enhancedHeight = await gallery.evaluate(
      element => element.getBoundingClientRect().height
    )
    expect(enhancedHeight).toBeCloseTo(initialHeight, 0)
    await gallery
      .getByRole('button', { name: 'Neste bilde', exact: true })
      .click()
    await expect(
      gallery.locator('[data-slot="carousel-item"]').nth(3)
    ).toHaveCSS('opacity', '1')
  } finally {
    if (hold) {
      hold = false
      await Promise.all(
        heldRequests.map(route =>
          route.continue().catch(() => {})
        )
      )
    }
    await page.unroute(
      '**/_next/static/chunks/**',
      delayOptionalChunks
    )
  }
})

test('preserves public variant URLs and the server-composed size guide', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const url = new URL(landingUrl)
  url.searchParams.set('utm_source', 'landing-loading-smoke')
  await page.goto(url.toString(), { waitUntil: 'load' })
  const size = page.getByRole('radio', {
    name: 'Størrelse Stor',
    exact: true
  })
  await size.click()
  await expect(size).toHaveAttribute('aria-checked', 'true')
  await expect(page).toHaveURL(/storrelse=stor/)
  expect(
    new URL(page.url()).searchParams.get('utm_source')
  ).toBe('landing-loading-smoke')
  await page
    .getByRole('button', {
      name: 'Størrelsestabell',
      exact: true
    })
    .click()
  const guide = page.getByRole('region', {
    name: 'Størrelsesveiledning'
  })
  await expect(guide).toBeVisible()
  await guide
    .getByRole('tab', { name: 'Stor', exact: true })
    .click()
  await expect(
    guide.getByRole('tabpanel', { name: 'Stor', exact: true })
  ).toContainText('Anbefalt høyde')
  await expect(
    guide.getByRole('tabpanel', { name: 'Stor', exact: true })
  ).toContainText('Passform og romslighet')
  await page
    .getByRole('button', { name: 'Materialer', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Materialer', exact: true })
  ).toHaveAttribute('aria-expanded', 'true')
  await expect(
    page.getByRole('button', { name: /^Legg i handlekurv/ })
  ).toBeEnabled()
})

test('waits for header interaction before prefetching other routes', async ({
  browser
}) => {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 }
    })
    try {
      const page = await context.newPage()
      const otherRoutePrefetches: string[] = []
      page.on('request', request => {
        const url = new URL(request.url())
        if (
          url.searchParams.has('_rsc') &&
          url.pathname !== '/skreddersy-varmen'
        ) {
          otherRoutePrefetches.push(url.pathname)
        }
      })
      await page.goto(landingUrl, { waitUntil: 'load' })
      await page.waitForTimeout(1200)
      expect(otherRoutePrefetches).toEqual([])
      if (width < 1024) {
        await page
          .locator('[data-track="HeroCtaSkreddersyVarmen"]')
          .click()
        await expect(
          page.locator('header[data-site-header]')
        ).toBeVisible()
      }
      await page
        .locator('[data-track="HeaderLogoClick"]')
        .click()
      await expect(page).toHaveURL(
        new URL('/', landingUrl).toString()
      )
    } finally {
      await context.close()
    }
  }
})
