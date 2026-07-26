import {
  expect,
  test,
  type Page,
  type Route
} from 'playwright/test'

const BASE_URL = 'http://localhost:3218'
const ARTICLE_PATH = '/magasinet/hva-er-utekos'
const ARTICLE_TITLE = 'Invester i din egen hygge'
const TRANSITION_NAME =
  'utekos-magazine-hero-hva-er-utekos'
const NEWSLETTER_SESSION_STORAGE_KEY =
  'utekos-newsletter-modal-dismissed-session'

type TransitionDiagnostics = {
  supported: boolean
  calls: number
  names: string[]
  groupAnimationDurations: string[]
  finishedDurations: number[]
}

const isProductionBuild =
  process.env.VIEW_TRANSITIONS_E2E_MODE === 'production'

async function isolateBrowserNetwork(page: Page) {
  await page.route('**/*', async (route: Route) => {
    const url = new URL(route.request().url())

    if (
      url.origin !== BASE_URL
      || url.pathname.startsWith('/__gtg')
      || url.pathname.startsWith('/__sgtm')
    ) {
      await route.abort('blockedbyclient')
      return
    }

    await route.continue()
  })
}

async function observeViewTransitions(page: Page) {
  await page.addInitScript(transitionName => {
    type BrowserViewTransition = {
      ready: Promise<unknown>
      finished: Promise<unknown>
    }
    type StartViewTransition = (
      ...args: unknown[]
    ) => BrowserViewTransition

    const documentWithTransitions = document as Document & {
      startViewTransition?: StartViewTransition
    }
    const originalStartViewTransition =
      documentWithTransitions.startViewTransition?.bind(document)
    const diagnostics: TransitionDiagnostics = {
      supported: Boolean(originalStartViewTransition),
      calls: 0,
      names: [],
      groupAnimationDurations: [],
      finishedDurations: []
    }

    Object.assign(window, {
      __utekosViewTransitionDiagnostics: diagnostics
    })

    if (!originalStartViewTransition) return

    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: (...args: unknown[]) => {
        diagnostics.calls += 1
        const startedAt = performance.now()
        const transition = originalStartViewTransition(...args)

        void transition.ready.then(() => {
          const names = Array.from(
            document.querySelectorAll<HTMLElement>(
              '[style*="view-transition-name"]'
            )
          ).map(element => element.style.viewTransitionName)

          diagnostics.names.push(...names)
          diagnostics.groupAnimationDurations.push(
            getComputedStyle(
              document.documentElement,
              `::view-transition-group(${transitionName})`
            ).animationDuration
          )
        })
        void transition.finished.then(() => {
          diagnostics.finishedDurations.push(
            performance.now() - startedAt
          )
        })

        return transition
      }
    })
  }, TRANSITION_NAME)
}

async function getTransitionDiagnostics(
  page: Page
): Promise<TransitionDiagnostics> {
  return page.evaluate(() => {
    return (
      window as typeof window & {
        __utekosViewTransitionDiagnostics: TransitionDiagnostics
      }
    ).__utekosViewTransitionDiagnostics
  })
}

function getArticleLink(page: Page) {
  return page
    .locator('a[data-track="MagazineGridClick"]')
    .filter({ hasText: ARTICLE_TITLE })
}

test.beforeEach(async ({ page }) => {
  await isolateBrowserNetwork(page)
  await page.addInitScript(storageKey => {
    sessionStorage.setItem(storageKey, Date.now().toString())
  }, NEWSLETTER_SESSION_STORAGE_KEY)
})

test('morphs the enabled magazine hero without changing navigation semantics', async ({
  page,
  browserName
}, testInfo) => {
  const transitionErrors: string[] = []
  page.on('console', message => {
    if (
      message.type() === 'error'
      && /view.?transition|duplicate/i.test(message.text())
    ) {
      transitionErrors.push(message.text())
    }
  })

  await observeViewTransitions(page)
  await page.goto('/magasinet')

  const articleLink = getArticleLink(page)
  await expect(articleLink).toHaveCount(1)
  await expect(articleLink).toHaveAttribute(
    'href',
    ARTICLE_PATH
  )
  await articleLink.press('Enter')

  await expect(page).toHaveURL(ARTICLE_PATH)
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: ARTICLE_TITLE
    })
  ).toBeAttached()
  await expect(page.locator('header figure')).toHaveCount(1)

  if (isProductionBuild) {
    await page.waitForFunction(() => {
      return (
        window as typeof window & {
          __utekosViewTransitionDiagnostics:
            TransitionDiagnostics
        }
      ).__utekosViewTransitionDiagnostics
        .finishedDurations.length > 0
    })
  }

  const diagnostics = await getTransitionDiagnostics(page)
  await testInfo.attach('view-transition-diagnostics.json', {
    body: JSON.stringify(diagnostics, null, 2),
    contentType: 'application/json'
  })
  if (diagnostics.supported) {
    expect(diagnostics.calls).toBeGreaterThan(0)
    expect(diagnostics.names).toContain(TRANSITION_NAME)
    expect(
      diagnostics.groupAnimationDurations
    ).toContain('0.24s')
    if (isProductionBuild) {
      expect(
        Math.max(...diagnostics.finishedDurations)
      ).toBeLessThanOrEqual(450)
    }
  } else {
    expect(['firefox', 'webkit']).toContain(browserName)
  }
  expect(transitionErrors).toEqual([])

  await page.goBack()
  await expect(page).toHaveURL('/magasinet')
  await expect(getArticleLink(page)).toHaveCount(1)
})

test('falls back to normal navigation when the browser API is unavailable', async ({
  page
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: undefined
    })
  })
  await page.goto('/magasinet')
  await getArticleLink(page).click()

  await expect(page).toHaveURL(ARTICLE_PATH)
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: ARTICLE_TITLE
    })
  ).toBeAttached()
})

test('disables the morph animation for reduced motion', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await observeViewTransitions(page)
  await page.goto('/magasinet')
  await getArticleLink(page).click()

  await expect(page).toHaveURL(ARTICLE_PATH)
  const diagnostics = await getTransitionDiagnostics(page)
  if (diagnostics.supported) {
    expect(diagnostics.calls).toBeGreaterThan(0)
    expect(
      diagnostics.groupAnimationDurations
    ).toContain('0s')
  }
})
