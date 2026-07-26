import {
  expect,
  test,
  type Page,
  type TestInfo
} from 'playwright/test'
import axe from 'axe-core'

type AxeWindow = Window & {
  axe: {
    run(
      context: Element,
      options: {
        runOnly: {
          type: 'tag'
          values: string[]
        }
      }
    ): Promise<{
      violations: Array<{
        id: string
        impact: string | null
      }>
    }>
  }
}

async function verifyCartRemoval(
  page: Page,
  testInfo: TestInfo,
  viewport: { width: number; height: number }
) {
  const runtimeErrors: string[] = []
  page.on('pageerror', error => runtimeErrors.push(error.message))
  await page.setViewportSize(viewport)

  await page.addInitScript(() => {
    sessionStorage.setItem(
      'utekos-newsletter-modal-dismissed-session',
      Date.now().toString()
    )
  })
  await page.goto('/produkter')

  await page
    .getByRole('button', { name: 'Ikke tillat', exact: true })
    .click({ timeout: 1_000 })
    .catch(() => undefined)

  await page
    .getByRole('group', { name: /Slide 1 of/u })
    .locator('a button')
    .first()
    .click()
  await page
    .getByRole('button', { name: /Velg størrelse/u })
    .first()
    .click()

  const drawer = page.locator(
    '[data-slot="drawer-content"][data-state="open"]'
  )
  await expect(drawer).toBeVisible()

  const removeButton = page
    .getByRole('button', {
      name: /Fjern .* fra handlekurven/u
    })
    .first()
  await expect(removeButton).toBeVisible()
  await removeButton.click()

  const confirmation = page.getByRole('button', {
    name: 'Ja, fjern produkt',
    exact: true
  })
  await expect(confirmation).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('removal-confirmation.png')
  })
  await page.addScriptTag({ content: axe.source })

  const accessibilityViolations = await page.evaluate(async () => {
    const dialog = document.querySelector(
      '[data-slot="alert-dialog-content"]'
    )

    if (!dialog) {
      return [{ id: 'missing-dialog', impact: 'critical' }]
    }

    const results = await (window as unknown as AxeWindow).axe.run(dialog, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag22aa']
      }
    })

    return results.violations
      .filter(
        violation =>
          violation.impact === 'critical' ||
          violation.impact === 'serious'
      )
      .map(violation => ({
        id: violation.id,
        impact: violation.impact
      }))
  })
  expect(accessibilityViolations).toEqual([])

  const confirmationReceivesPointer = await confirmation.evaluate(
    element => {
      const bounds = element.getBoundingClientRect()
      const hitTarget = document.elementFromPoint(
        bounds.left + bounds.width / 2,
        bounds.top + bounds.height / 2
      )

      return hitTarget === element || element.contains(hitTarget)
    }
  )
  expect(confirmationReceivesPointer).toBe(true)

  await confirmation.click()

  await expect(
    page.getByRole('button', {
      name: /Fjern .* fra handlekurven/u
    })
  ).toHaveCount(0)
  await expect(
    page.locator('button[aria-label^="Åpne handlekurven"]')
  ).toHaveAttribute('aria-label', /0 varer/u)
  expect(runtimeErrors).toEqual([])
}

for (const testCase of [
  {
    name: 'mobile',
    viewport: { width: 390, height: 844 }
  },
  {
    name: 'desktop',
    viewport: { width: 1440, height: 900 }
  }
] as const) {
  test(`the cart removal confirmation works on ${testCase.name}`, async ({
    page
  }, testInfo) => {
    await verifyCartRemoval(
      page,
      testInfo,
      testCase.viewport
    )
  })
}
