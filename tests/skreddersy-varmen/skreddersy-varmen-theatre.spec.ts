import { expect, test } from 'playwright/test'

const landingUrl =
  process.env.SKREDDERSY_VARMEN_BASE_URL ??
  'http://localhost:3100/skreddersy-varmen'

test.use({ viewport: { width: 1440, height: 900 } })

test('keeps one large framed image beside the stationary desktop scene copy', async ({
  page
}) => {
  await page.goto(landingUrl, { waitUntil: 'load' })

  const scenes = page.locator('[data-mode-scene]')
  const firstFrame = page
    .locator('[data-mode-scene="fullengde"]')
    .locator(':scope > div')
    .first()

  await expect(page.locator('main')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(scenes).toHaveCount(3)
  await expect(scenes.locator('img')).toHaveCount(3)
  await expect(firstFrame).toBeVisible()

  const frameBox = await firstFrame.boundingBox()

  expect(frameBox).not.toBeNull()
  expect(frameBox!.width).toBeGreaterThan(700)
  expect(frameBox!.height).toBeGreaterThan(650)
})

test('uses the readable static document flow for reduced motion', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const state = await page.evaluate(() => {
    const scenes = Array.from(
      document.querySelectorAll<HTMLElement>('[data-mode-scene]')
    )
    const introLogo = document.querySelector<HTMLImageElement>(
      'img[src*="HorizontalSVGLogo.svg"]'
    )
    const actions = document.querySelector<HTMLElement>(
      '[data-header-part="actions"]'
    )
    const empathySticky = document.querySelector<HTMLElement>(
      '[data-empathy-reveal-surface]'
    )
    const empathyRecognition =
      document.querySelector<HTMLElement>(
        '[data-empathy-scene="recognition"]'
      )

    return {
      reducedMotion: matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches,
      scenePositions: scenes.map(
        scene => getComputedStyle(scene).position
      ),
      introDisplay:
        introLogo?.parentElement ?
          getComputedStyle(introLogo.parentElement).display
        : null,
      headerVisibility:
        actions ? getComputedStyle(actions).visibility : null,
      empathyMediaImages: document.querySelectorAll(
        '[data-empathy-media-scene] img'
      ).length,
      empathyRecognitionTransform:
        empathyRecognition ?
          getComputedStyle(empathyRecognition).transform
        : null,
      empathyStickyPosition:
        empathySticky ?
          getComputedStyle(empathySticky).position
        : null
    }
  })

  expect(state.reducedMotion).toBe(true)
  expect(state.scenePositions).toEqual([
    'static',
    'static',
    'static'
  ])
  expect(state.introDisplay).toBe('none')
  expect(state.headerVisibility).toBe('visible')
  expect(state.empathyMediaImages).toBe(2)
  expect(state.empathyRecognitionTransform).toBe('none')
  expect(state.empathyStickyPosition).toBe('relative')
})

test('remains readable without horizontal scrolling at a 200-percent equivalent viewport', async ({
  page
}) => {
  await page.setViewportSize({ width: 195, height: 422 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const state = await page.evaluate(() => {
    window.scrollTo(100, 0)

    const answerPanel = document.querySelector<HTMLElement>(
      '[data-empathy-answer-panel]'
    )
    const lastAnswerStep = document.querySelector<HTMLElement>(
      '[data-empathy-answer-step="3"]'
    )

    if (!answerPanel || !lastAnswerStep) {
      throw new Error('Missing empathy answer content')
    }

    const panelRect = answerPanel.getBoundingClientRect()
    const lastStepRect = lastAnswerStep.getBoundingClientRect()

    return new Promise<{
      answerPanelFits: boolean
      clientWidth: number
      lastStepFits: boolean
      mediaScenes: number
      scrollWidth: number
      scrollX: number
      textScenes: number
    }>(resolve =>
      requestAnimationFrame(() =>
        resolve({
          answerPanelFits:
            answerPanel.scrollHeight <= panelRect.height + 1,
          clientWidth: document.documentElement.clientWidth,
          lastStepFits:
            lastStepRect.bottom <= panelRect.bottom + 1,
          mediaScenes: document.querySelectorAll(
            '[data-empathy-media-scene]'
          ).length,
          scrollWidth: document.documentElement.scrollWidth,
          scrollX,
          textScenes: document.querySelectorAll(
            '[data-empathy-scene]'
          ).length
        })
      )
    )
  })

  expect(state.textScenes).toBe(4)
  expect(state.mediaScenes).toBe(2)
  expect(state.answerPanelFits).toBe(true)
  expect(state.lastStepFits).toBe(true)
  expect(state.scrollWidth).toBe(state.clientWidth)
  expect(state.scrollX).toBe(0)
})

test('uses readable static story flow on a short mobile viewport', async ({
  page
}) => {
  await page.setViewportSize({ width: 320, height: 422 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const state = await page.evaluate(() => {
    const textSticky = document.querySelector<HTMLElement>(
      '[data-empathy-reveal-surface]'
    )
    const answerSticky = document.querySelector<HTMLElement>(
      '[data-empathy-question-answer-sticky]'
    )
    const resolution = document.querySelector<HTMLElement>(
      '[data-empathy-resolution]'
    )
    const recognition = document.querySelector<HTMLElement>(
      '[data-empathy-scene="recognition"]'
    )

    if (
      !textSticky ||
      !answerSticky ||
      !resolution ||
      !recognition
    ) {
      throw new Error('Missing short-viewport story surfaces')
    }

    return {
      answerStickyPosition:
        getComputedStyle(answerSticky).position,
      recognitionAnimation:
        getComputedStyle(recognition).animationName,
      resolutionPosition: getComputedStyle(resolution).position,
      textStickyPosition: getComputedStyle(textSticky).position
    }
  })

  expect(state.textStickyPosition).toBe('relative')
  expect(state.answerStickyPosition).toBe('relative')
  expect(state.resolutionPosition).toBe('relative')
  expect(state.recognitionAnimation).toBe('none')
})

test('uses the static empathy flow at a 200-percent equivalent motion viewport', async ({
  page
}) => {
  await page.setViewportSize({ width: 195, height: 422 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const state = await page.evaluate(() => {
    const answerPanel = document.querySelector<HTMLElement>(
      '[data-empathy-answer-panel]'
    )
    const questionSticky = document.querySelector<HTMLElement>(
      '[data-empathy-question-answer-sticky]'
    )
    const steps = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-empathy-answer-step]'
      )
    )

    if (!answerPanel || !questionSticky) {
      throw new Error('Missing empathy reflow surfaces')
    }

    return {
      answerTransform: getComputedStyle(answerPanel).transform,
      documentWidth: document.documentElement.scrollWidth,
      questionPosition:
        getComputedStyle(questionSticky).position,
      stepVisibility: steps.map(
        step => getComputedStyle(step).visibility
      ),
      viewportWidth: innerWidth
    }
  })

  expect(state.answerTransform).toBe('none')
  expect(state.questionPosition).toBe('relative')
  expect(state.stepVisibility).toEqual([
    'visible',
    'visible',
    'visible'
  ])
  expect(state.documentWidth).toBe(state.viewportWidth)
})

test('keeps hidden header controls out of the initial keyboard order', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(landingUrl, { waitUntil: 'domcontentloaded' })

  const actions = page.locator('[data-header-part="actions"]')

  await expect(actions).toHaveCSS('visibility', 'hidden')
  await page.keyboard.press('Tab')

  const focusedHiddenHeader = await page.evaluate(() =>
    Boolean(
      document.activeElement?.closest(
        '[data-header-part="actions"]'
      )
    )
  )

  expect(focusedHiddenHeader).toBe(false)

  await expect(actions).toHaveCSS('visibility', 'visible', {
    timeout: 5200
  })
})

test('keeps every intro phase calm and strictly sequential', async ({
  page
}) => {
  await page.goto(landingUrl, { waitUntil: 'load' })

  const introCloud = page.locator('[class*="introCloud"]')
  const introJungle = page.locator('[class*="introJungle"]')
  const introLogo = page
    .locator('img[src*="HorizontalSVGLogo.svg"]')
    .locator('..')
  const headerBrand = page.locator('[data-header-part="brand"]')
  const headerActions = page.locator(
    '[data-header-part="actions"]'
  )
  const heroMedia = page.locator('[class*="heroMedia"]')

  await expect(introCloud).toHaveCount(1, { timeout: 15_000 })
  await expect(introJungle).toHaveCount(1)
  await expect(introLogo).toHaveCount(1)
  await expect(headerBrand).toHaveCount(1)
  await expect(headerActions).toHaveCount(1)
  await expect(heroMedia).toHaveCount(1)

  const choreography = await page.evaluate(() => {
    const requiredElement = <T extends Element>(
      selector: string
    ) => {
      const element = document.querySelector<T>(selector)

      if (!element) {
        throw new Error(
          `Missing choreography element: ${selector}`
        )
      }

      return element
    }
    const logoImage = requiredElement<HTMLImageElement>(
      'img[src*="HorizontalSVGLogo.svg"]'
    )
    const logo = logoImage.parentElement

    if (!logo) {
      throw new Error('Missing intro logo surface')
    }

    const elements = {
      cloud: requiredElement<HTMLElement>(
        '[class*="introCloud"]'
      ),
      jungle: requiredElement<HTMLElement>(
        '[class*="introJungle"]'
      ),
      logo,
      headerBrand: requiredElement<HTMLElement>(
        '[data-header-part="brand"]'
      ),
      headerActions: requiredElement<HTMLElement>(
        '[data-header-part="actions"]'
      ),
      hero: requiredElement<HTMLElement>('[class*="heroMedia"]')
    }
    const milliseconds = (value: string) =>
      value.endsWith('ms') ?
        Number.parseFloat(value)
      : Number.parseFloat(value) * 1000

    const animationDetails = (element: Element) => {
      const styles = getComputedStyle(element)
      const animation = element.getAnimations()[0]
      const effect = animation?.effect as KeyframeEffect | null

      return {
        delay: milliseconds(styles.animationDelay),
        duration: milliseconds(styles.animationDuration),
        endTime: Number(
          animation?.effect?.getComputedTiming().endTime ?? 0
        ),
        keyframes: (effect?.getKeyframes() ?? []).map(
          (keyframe: ComputedKeyframe) => ({
            easing: keyframe.easing,
            offset: keyframe.computedOffset,
            transform:
              typeof keyframe.transform === 'string' ?
                keyframe.transform
              : ''
          })
        )
      }
    }

    return {
      cloudBackground: getComputedStyle(elements.cloud)
        .backgroundColor,
      cloud: animationDetails(elements.cloud),
      jungle: animationDetails(elements.jungle),
      logo: animationDetails(elements.logo),
      headerBrand: animationDetails(elements.headerBrand),
      headerActions: animationDetails(elements.headerActions),
      hero: animationDetails(elements.hero)
    }
  })

  const hopIndex = choreography.logo.keyframes.findIndex(
    ({ transform }) => transform.includes('translateY(-')
  )
  const landingIndex = choreography.logo.keyframes.findIndex(
    ({ transform }, index) =>
      index > hopIndex && transform.includes('translateY(0')
  )
  const exitIndex = choreography.logo.keyframes.findIndex(
    ({ transform }, index) =>
      index > landingIndex &&
      /translateY\([1-9]\d{2,}(?:\.\d+)?px\)/.test(transform)
  )
  const exitStart = choreography.logo.keyframes[exitIndex - 1]
  const logoEnd =
    choreography.logo.delay + choreography.logo.duration
  const headerEnd =
    choreography.headerBrand.delay +
    choreography.headerBrand.duration

  expect(choreography.cloudBackground).toBe('rgb(255, 255, 255)')
  expect(choreography.logo.delay).toBeGreaterThanOrEqual(400)
  expect(choreography.logo.delay).toBeLessThanOrEqual(500)
  expect(choreography.logo.duration).toBeGreaterThanOrEqual(3400)
  expect(choreography.logo.endTime).toBeGreaterThanOrEqual(3800)
  expect(hopIndex).toBeGreaterThan(0)
  expect(landingIndex).toBeGreaterThan(hopIndex)
  expect(exitIndex).toBeGreaterThan(landingIndex)
  expect(exitStart?.easing).toBe('cubic-bezier(0.16, 1, 0.3, 1)')
  expect(choreography.jungle.delay).toBeGreaterThanOrEqual(1500)
  expect(choreography.cloud.endTime).toBeGreaterThanOrEqual(2300)
  expect(choreography.jungle.endTime).toBeCloseTo(
    choreography.hero.endTime,
    0
  )
  expect(choreography.headerBrand.delay).toBeCloseTo(logoEnd, 0)
  expect(choreography.headerActions.delay).toBeCloseTo(
    logoEnd,
    0
  )
  expect(choreography.headerActions.duration).toBe(
    choreography.headerBrand.duration
  )
  expect(choreography.hero.delay).toBeGreaterThanOrEqual(
    headerEnd
  )
})

test('never reveals a later intro layer before the active phase is finished', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(landingUrl, { waitUntil: 'load' })
  await expect(
    page.locator('img[src*="HorizontalSVGLogo.svg"]')
  ).toHaveCount(1, { timeout: 15_000 })

  const readPhaseAt = (time: number) =>
    page.evaluate(currentTime => {
      const logoImage = document.querySelector<HTMLImageElement>(
        'img[src*="HorizontalSVGLogo.svg"]'
      )
      const elements = {
        cloud: document.querySelector<HTMLElement>(
          '[class*="introCloud"]'
        ),
        jungle: document.querySelector<HTMLElement>(
          '[class*="introJungle"]'
        ),
        logo: logoImage?.parentElement ?? null,
        brand: document.querySelector<HTMLElement>(
          '[data-header-part="brand"]'
        ),
        actions: document.querySelector<HTMLElement>(
          '[data-header-part="actions"]'
        ),
        hero: document.querySelector<HTMLElement>(
          '[class*="heroMedia"]'
        )
      }

      for (const element of Object.values(elements)) {
        for (const animation of element?.getAnimations() ?? []) {
          const name = (animation as CSSAnimation).animationName

          if (
            name.includes('skreddersy-') &&
            !name.includes('hero-curtain')
          ) {
            animation.pause()
            animation.currentTime = currentTime
          }
        }
      }

      const visibility = (element: Element | null) =>
        element ? getComputedStyle(element).visibility : null

      return Object.fromEntries(
        Object.entries(elements).map(([key, element]) => [
          key,
          visibility(element)
        ])
      )
    }, time)

  expect(await readPhaseAt(250)).toEqual({
    cloud: 'visible',
    jungle: 'hidden',
    logo: 'hidden',
    brand: 'hidden',
    actions: 'hidden',
    hero: 'hidden'
  })

  expect(await readPhaseAt(1000)).toEqual({
    cloud: 'visible',
    jungle: 'hidden',
    logo: 'visible',
    brand: 'hidden',
    actions: 'hidden',
    hero: 'hidden'
  })

  expect(await readPhaseAt(2100)).toEqual({
    cloud: 'visible',
    jungle: 'visible',
    logo: 'visible',
    brand: 'hidden',
    actions: 'hidden',
    hero: 'hidden'
  })

  expect(await readPhaseAt(3700)).toEqual({
    cloud: 'hidden',
    jungle: 'visible',
    logo: 'visible',
    brand: 'hidden',
    actions: 'hidden',
    hero: 'hidden'
  })

  expect(await readPhaseAt(4400)).toEqual({
    cloud: 'hidden',
    jungle: 'visible',
    logo: 'hidden',
    brand: 'visible',
    actions: 'visible',
    hero: 'hidden'
  })

  expect(await readPhaseAt(5200)).toEqual({
    cloud: 'hidden',
    jungle: 'visible',
    logo: 'hidden',
    brand: 'visible',
    actions: 'visible',
    hero: 'visible'
  })
})

test('reveals the mobile manifesto and complete bonfire panel without dead scroll space', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const heroSurface = page.locator('[data-hero-reveal-surface]')
  const textTheatre = page.locator('[data-empathy-text-theatre]')
  const empathySurface = page.locator(
    '[data-empathy-reveal-surface]'
  )
  const moment = page.locator('[data-empathy-scene="moment"]')
  const recognition = page.locator(
    '[data-empathy-scene="recognition"]'
  )
  const bonfireCopy = page.locator(
    '[data-empathy-scene="bonfire-copy"]'
  )
  const firstMediaScene = page.locator(
    '[data-empathy-media-scene="bonfire"]'
  )
  const chillMediaScene = page.locator(
    '[data-empathy-media-scene="chill"]'
  )
  const question = page.locator(
    '[data-empathy-scene="question"]'
  )
  const answerPanel = page.locator('[data-empathy-answer-panel]')
  const mediaFrames = page.locator(
    '[data-empathy-media-scene] [class*="empathyMediaFrame"]'
  )

  await expect(heroSurface).toHaveCount(1, { timeout: 15_000 })
  await expect(textTheatre).toHaveCount(1)
  await expect(empathySurface).toHaveCount(1)
  await expect(moment.locator('h2')).toHaveCount(1)
  await expect(moment.locator('p')).toHaveCount(0)
  await expect(recognition.locator('p')).toHaveCount(1)
  await expect(bonfireCopy.locator('p')).toHaveCount(1)
  await expect(mediaFrames).toHaveCount(2)
  await expect(bonfireCopy.locator('p')).toHaveText(
    'Praten går lett rundt bålpannen.'
  )
  await expect(firstMediaScene.locator('p')).toHaveText(
    'Flammene danser og roen har senket seg.'
  )
  await expect(firstMediaScene.locator('img')).toHaveAttribute(
    'src',
    /SkreddersyVarmen-1/
  )
  await expect(chillMediaScene.locator('img')).toHaveAttribute(
    'src',
    /UtekosTechDownMElegense/
  )
  await expect(question.locator('p')).toHaveText(
    '“Det begynner å bli kaldt. Skal vi trekke inn?”'
  )
  await expect(question.locator('img')).toHaveCount(0)
  await expect(answerPanel.getByRole('list')).toHaveCount(1)
  await expect(answerPanel.getByRole('listitem')).toHaveCount(3)
  await expect(
    page.locator('[data-mode-scene="oppjustert"] img')
  ).toHaveAttribute('src', /UtekosTechDownMob/)
  await expect(
    page.locator('nav[aria-label="breadcrumb"]')
  ).toHaveCount(0)

  const mediaFrameRatios = await mediaFrames.evaluateAll(
    frames =>
      frames.map(frame => {
        const rect = frame.getBoundingClientRect()
        return rect.width / rect.height
      })
  )

  for (const ratio of mediaFrameRatios) {
    expect(ratio).toBeCloseTo(4 / 5, 2)
  }

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(100)

  const initial = await page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>(
      '[data-hero-reveal-surface]'
    )
    const sticky = document.querySelector<HTMLElement>(
      '[data-empathy-reveal-surface]'
    )
    const heading = document.querySelector<HTMLElement>(
      '#empathy-heading'
    )
    const recognition = document.querySelector<HTMLElement>(
      '[data-empathy-scene="recognition"]'
    )

    if (!hero || !sticky || !heading || !recognition) {
      throw new Error('Missing reveal surfaces')
    }

    const headingRect = heading.getBoundingClientRect()
    const hit = document.elementFromPoint(
      headingRect.left + headingRect.width / 2,
      headingRect.top + headingRect.height / 2
    )

    return {
      headingCenter: headingRect.top + headingRect.height / 2,
      headingCoveredByHero: Boolean(hit && hero.contains(hit)),
      heroAnimationName: getComputedStyle(hero).animationName,
      heroTop: hero.getBoundingClientRect().top,
      recognitionLeft: recognition.getBoundingClientRect().left,
      recognitionVisibility:
        getComputedStyle(recognition).visibility,
      stickyPosition: getComputedStyle(sticky).position
    }
  })

  await page.evaluate(() => window.scrollTo(0, innerHeight))
  await page.waitForTimeout(100)

  const revealed = await page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>(
      '[data-hero-reveal-surface]'
    )
    const heading = document.querySelector<HTMLElement>(
      '[data-empathy-reveal-heading]'
    )
    const recognition = document.querySelector<HTMLElement>(
      '[data-empathy-scene="recognition"]'
    )

    if (!hero || !heading || !recognition) {
      throw new Error('Missing reveal surfaces')
    }

    const headingRect = heading.getBoundingClientRect()

    return {
      headingCenter: headingRect.top + headingRect.height / 2,
      heroBottom: hero.getBoundingClientRect().bottom,
      recognitionLeft: recognition.getBoundingClientRect().left,
      recognitionVisibility:
        getComputedStyle(recognition).visibility
    }
  })

  expect(initial.heroAnimationName).toContain('hero-lift')
  expect(Math.abs(initial.heroTop)).toBeLessThanOrEqual(1)
  expect(initial.headingCoveredByHero).toBe(true)
  expect(initial.headingCenter).toBeCloseTo(844 / 2, -1)
  expect(initial.recognitionVisibility).toBe('visible')
  expect(initial.recognitionLeft).toBeGreaterThanOrEqual(389)
  expect(initial.stickyPosition).toBe('sticky')
  expect(revealed.heroBottom).toBeLessThanOrEqual(1)
  expect(revealed.headingCenter).toBeCloseTo(844 / 2, -1)
  expect(revealed.recognitionVisibility).toBe('visible')
  expect(revealed.recognitionLeft).toBeGreaterThanOrEqual(389)

  await page.evaluate(() =>
    window.scrollTo(0, innerHeight * 1.1)
  )
  await page.waitForTimeout(100)

  const transition = await recognition.evaluate(element => {
    const rect = element.getBoundingClientRect()

    return {
      left: rect.left,
      visibility: getComputedStyle(element).visibility
    }
  })

  expect(transition.visibility).toBe('visible')
  expect(transition.left).toBeGreaterThan(1)
  expect(transition.left).toBeLessThan(390)

  await page.evaluate(() =>
    window.scrollTo(0, innerHeight * 1.5)
  )
  await page.waitForTimeout(100)

  const settled = await recognition.evaluate(element => ({
    left: element.getBoundingClientRect().left,
    visibility: getComputedStyle(element).visibility
  }))

  expect(settled.visibility).toBe('visible')
  expect(Math.abs(settled.left)).toBeLessThanOrEqual(1)

  await page.evaluate(() =>
    window.scrollTo(0, innerHeight * 1.65)
  )
  await page.waitForTimeout(100)

  const bonfireCopyEntering = await bonfireCopy.evaluate(
    element => ({
      top: element.getBoundingClientRect().top,
      visibility: getComputedStyle(element).visibility
    })
  )

  expect(bonfireCopyEntering.visibility).toBe('visible')
  expect(bonfireCopyEntering.top).toBeGreaterThan(1)
  expect(bonfireCopyEntering.top).toBeLessThan(844)

  await page.evaluate(() =>
    window.scrollTo(0, innerHeight * 1.95)
  )
  await page.waitForTimeout(100)

  const bonfireCopySettled = await bonfireCopy.evaluate(
    element => ({
      top: element.getBoundingClientRect().top,
      visibility: getComputedStyle(element).visibility
    })
  )

  expect(bonfireCopySettled.visibility).toBe('visible')
  expect(Math.abs(bonfireCopySettled.top)).toBeLessThanOrEqual(1)

  await page.evaluate(() =>
    window.scrollTo(0, innerHeight * 2.1)
  )
  await page.waitForTimeout(100)

  const bonfirePanelEntering = await firstMediaScene.evaluate(
    element => {
      const rect = element.getBoundingClientRect()

      return {
        left: rect.left,
        top: rect.top,
        visibility: getComputedStyle(element).visibility
      }
    }
  )

  expect(bonfirePanelEntering.visibility).toBe('visible')
  expect(bonfirePanelEntering.left).toBeGreaterThan(1)
  expect(bonfirePanelEntering.left).toBeLessThan(390)
  expect(Math.abs(bonfirePanelEntering.top)).toBeLessThanOrEqual(
    1
  )

  await page.evaluate(() =>
    window.scrollTo(0, innerHeight * 2.4)
  )
  await page.waitForTimeout(100)

  const bonfirePanelSettled = await firstMediaScene.evaluate(
    element => ({
      left: element.getBoundingClientRect().left,
      visibility: getComputedStyle(element).visibility
    })
  )

  expect(bonfirePanelSettled.visibility).toBe('visible')
  expect(Math.abs(bonfirePanelSettled.left)).toBeLessThanOrEqual(
    1
  )

  await page.evaluate(() =>
    window.scrollTo(0, innerHeight * 2.6)
  )
  await page.waitForTimeout(100)

  const mediaEntry = await chillMediaScene.evaluate(element => {
    const rect = element.getBoundingClientRect()

    return { bottom: rect.bottom, top: rect.top }
  })

  expect(mediaEntry.top).toBeGreaterThan(0)
  expect(mediaEntry.top).toBeLessThan(844)
  expect(mediaEntry.bottom).toBeGreaterThan(844)

  const coverage = await page.evaluate(async () => {
    const selectors = [
      '[data-hero-reveal-surface]',
      '[data-empathy-scene="moment"]',
      '[data-empathy-scene="recognition"]',
      '[data-empathy-scene="bonfire-copy"]',
      '[data-empathy-media-scene="bonfire"]',
      '[data-empathy-media-scene="chill"]'
    ]
    const results: boolean[] = []

    for (let progress = 0; progress <= 3.25; progress += 0.25) {
      window.scrollTo(0, innerHeight * progress)
      await new Promise<void>(resolve =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => resolve())
        )
      )

      const centerY = innerHeight / 2
      const covered = selectors.some(selector => {
        const element =
          document.querySelector<HTMLElement>(selector)
        if (!element) return false

        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)

        return (
          style.visibility === 'visible' &&
          Number.parseFloat(style.opacity || '1') > 0 &&
          rect.top <= centerY &&
          rect.bottom >= centerY
        )
      })

      results.push(covered)
    }

    return results
  })

  expect(coverage.every(Boolean)).toBe(true)
})

test('keeps the empathy story static and readable on desktop', async ({
  page
}) => {
  await page.goto(landingUrl, { waitUntil: 'load' })
  const headerActions = page.locator(
    '[data-header-part="actions"]'
  )
  await expect(headerActions).toHaveCount(1)
  await headerActions.evaluate(async element => {
    await Promise.all(
      element
        .getAnimations()
        .map(animation => animation.finished)
    )
  })

  const state = await page.evaluate(() => {
    const sticky = document.querySelector<HTMLElement>(
      '[data-empathy-reveal-surface]'
    )
    const recognition = document.querySelector<HTMLElement>(
      '[data-empathy-scene="recognition"]'
    )
    const heroPromotion = document.querySelector<HTMLElement>(
      '[class*="heroPromotion"]'
    )
    const answerPanel = document.querySelector<HTMLElement>(
      '[data-empathy-answer-panel]'
    )
    const questionSticky = document.querySelector<HTMLElement>(
      '[data-empathy-question-answer-sticky]'
    )

    if (
      !sticky ||
      !recognition ||
      !heroPromotion ||
      !answerPanel ||
      !questionSticky
    ) {
      throw new Error('Missing desktop fallback surfaces')
    }

    return {
      heroHeight: heroPromotion.getBoundingClientRect().height,
      mediaImages: document.querySelectorAll(
        '[data-empathy-media-scene] img'
      ).length,
      recognitionTransform:
        getComputedStyle(recognition).transform,
      answerTransform: getComputedStyle(answerPanel).transform,
      answerSteps: document.querySelectorAll(
        '[data-empathy-answer-step]'
      ).length,
      questionStickyPosition:
        getComputedStyle(questionSticky).position,
      stickyPosition: getComputedStyle(sticky).position,
      textScenes: document.querySelectorAll(
        '[data-empathy-scene]'
      ).length,
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth
    }
  })

  expect(state.heroHeight).toBeCloseTo(900, 0)
  expect(state.textScenes).toBe(4)
  expect(state.mediaImages).toBe(2)
  expect(state.stickyPosition).toBe('relative')
  expect(state.questionStickyPosition).toBe('relative')
  expect(state.recognitionTransform).toBe('none')
  expect(state.answerTransform).toBe('none')
  expect(state.answerSteps).toBe(3)
  expect(state.documentWidth).toBe(state.viewportWidth)
})

test('uses a curtain reveal, side-entering answer, and ordered three-step sequence', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const theatre = page.locator(
    '[data-empathy-question-answer-theatre]'
  )
  const curtain = page.locator('[data-empathy-question-curtain]')
  const question = page.locator(
    '[data-empathy-scene="question"]'
  )
  const answer = page.locator('[data-empathy-answer-panel]')
  const steps = page.locator('[data-empathy-answer-step]')
  const emphasis = page.locator(
    '[data-empathy-resolution-emphasis]'
  )
  const resolutionBody = page.locator(
    '[data-empathy-resolution-statement]'
  )

  await expect(theatre).toHaveCount(1, { timeout: 15_000 })
  await expect(curtain).toHaveCount(1)
  await expect(question).toHaveText(
    '“Det begynner å bli kaldt. Skal vi trekke inn?”'
  )
  await expect(answer).toContainText(
    'Med Utekos® blir svaret enkelt.'
  )
  await expect(steps).toHaveCount(3)
  await expect(steps.nth(0)).toHaveText('Tilpass passform')
  await expect(steps.nth(1)).toHaveText('Reguler ventilasjon')
  await expect(steps.nth(2)).toHaveText(
    'Velg mellom ulike funksjonelle moduser.'
  )
  await expect(resolutionBody).toHaveText(
    'Skreddersy varmen for å fortsette opplevelsen av kompromissløs komfort.'
  )
  await expect(emphasis).toHaveText('Helt uavbrutt.')
  await expect(
    page.getByRole('button', {
      name: 'Utforsk Utekos TechDown™'
    })
  ).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: 'Utforsk Utekos TechDown™' })
  ).toHaveCount(0)

  const geometry = await theatre.evaluate(element => ({
    activeDistance:
      element.getBoundingClientRect().height - innerHeight,
    documentTop: element.getBoundingClientRect().top + scrollY
  }))

  const scrollToProgress = async (progress: number) => {
    await page.evaluate(
      ({ documentTop, activeDistance, progress }) =>
        window.scrollTo(
          0,
          documentTop + activeDistance * progress
        ),
      { ...geometry, progress }
    )
    await page.waitForTimeout(100)
  }

  await scrollToProgress(0)
  await expect(answer).toHaveCSS('visibility', 'visible')
  await expect(steps.nth(0)).toHaveCSS('visibility', 'visible')
  await expect(steps.nth(1)).toHaveCSS('visibility', 'visible')
  await expect(steps.nth(2)).toHaveCSS('visibility', 'visible')
  const covered = await page.evaluate(() => {
    const curtain = document.querySelector<HTMLElement>(
      '[data-empathy-question-curtain]'
    )
    const hit = document.elementFromPoint(
      innerWidth / 2,
      innerHeight / 2
    )

    return Boolean(curtain && hit && curtain.contains(hit))
  })

  expect(covered).toBe(true)

  await scrollToProgress(0.19)
  const curtainReveal = await page.evaluate(() => {
    const curtain = document.querySelector<HTMLElement>(
      '[data-empathy-question-curtain]'
    )
    const question = document.querySelector<HTMLElement>(
      '[data-empathy-scene="question"]'
    )

    if (!curtain || !question) {
      throw new Error('Missing curtain surfaces')
    }

    const hit = document.elementFromPoint(
      innerWidth / 2,
      innerHeight / 2
    )

    return {
      curtainTop: curtain.getBoundingClientRect().top,
      questionAtCenter: Boolean(hit && question.contains(hit)),
      questionTop: question.getBoundingClientRect().top
    }
  })

  expect(curtainReveal.curtainTop).toBeLessThan(0)
  expect(curtainReveal.curtainTop).toBeGreaterThan(-844)
  expect(curtainReveal.questionAtCenter).toBe(true)
  expect(
    Math.abs(curtainReveal.questionTop)
  ).toBeLessThanOrEqual(1)

  await scrollToProgress(0.43)
  const answerEntering = await answer.evaluate(element => ({
    left: element.getBoundingClientRect().left,
    visibility: getComputedStyle(element).visibility
  }))

  expect(answerEntering.visibility).toBe('visible')
  expect(answerEntering.left).toBeGreaterThan(1)
  expect(answerEntering.left).toBeLessThan(390)

  await scrollToProgress(0.61)
  await expect(steps.nth(0)).toHaveCSS('opacity', '1')
  await expect(steps.nth(1)).toHaveCSS('opacity', '0')
  await expect(steps.nth(2)).toHaveCSS('opacity', '0')

  await scrollToProgress(0.7)
  await expect(steps.nth(0)).toHaveCSS('opacity', '1')
  await expect(steps.nth(1)).toHaveCSS('opacity', '1')
  await expect(steps.nth(2)).toHaveCSS('opacity', '0')

  await scrollToProgress(0.8)
  await expect(steps.nth(2)).toHaveCSS('opacity', '1')

  const resolutionTop = await resolutionBody.evaluate(
    element =>
      element
        .closest('[data-empathy-resolution]')!
        .getBoundingClientRect().top + scrollY
  )

  await page.evaluate(
    y => window.scrollTo(0, y),
    resolutionTop - 844 * 0.25
  )
  await page.waitForTimeout(100)

  const emphasisState = await page.evaluate(() => {
    const body = document.querySelector<HTMLElement>(
      '[data-empathy-resolution-statement]'
    )
    const emphasis = document.querySelector<HTMLElement>(
      '[data-empathy-resolution-emphasis]'
    )

    if (!body || !emphasis) {
      throw new Error('Missing resolution emphasis')
    }

    return {
      animationName: getComputedStyle(emphasis).animationName,
      bodyColor: getComputedStyle(body).color,
      emphasisColor: getComputedStyle(emphasis).color,
      visibility: getComputedStyle(emphasis).visibility
    }
  })

  expect(emphasisState.animationName).toBe('none')
  expect(emphasisState.emphasisColor).not.toBe(
    emphasisState.bodyColor
  )
  expect(emphasisState.visibility).toBe('visible')
})

test('does not expose the empathy impression sentinel before the hero lift', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const sentinel = page.locator(
    '[data-empathy-impression-sentinel]'
  )
  await expect(sentinel).toHaveCount(1, { timeout: 15_000 })

  const initialTop = await sentinel.evaluate(
    element =>
      element.parentElement?.getBoundingClientRect().top ?? 0
  )

  expect(initialTop).toBeGreaterThanOrEqual(844 * 1.99)

  await page.evaluate(() =>
    window.scrollTo(0, innerHeight + 120)
  )
  await page.waitForTimeout(100)

  const revealedTop = await sentinel.evaluate(
    element =>
      element.parentElement?.getBoundingClientRect().top ?? 0
  )

  expect(revealedTop).toBeGreaterThan(0)
  expect(revealedTop).toBeLessThan(844)
})

test('keeps the redesigned technology instrument keyboard-operable', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const section = page.locator('[data-techdown-technology]')
  const instrument = page.locator('[data-techdown-instrument]')
  const range = page.locator('#techdown-moisture-slider')

  await expect(section).toHaveCount(1, { timeout: 15_000 })
  await expect(instrument.locator('img')).toHaveCount(2)
  await range.scrollIntoViewIfNeeded()
  await range.focus()
  await page.keyboard.press('End')

  await expect(range).toHaveValue('100')
  await expect(instrument.locator('output')).toContainText(
    '100 % tørr side'
  )
  await expect(instrument.locator('h3')).toHaveText(
    'Luftlommer holder på varmen'
  )

  const geometry = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }))

  expect(geometry.scrollWidth).toBe(geometry.clientWidth)
})

test('holds the resolution while the complete adaptive-functionality section enters from the side', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const section = page.locator('[data-three-in-one-surface]')
  const resolution = page.locator('[data-empathy-resolution]')
  const resolutionTrack = page.locator(
    '[data-empathy-resolution-track]'
  )
  const resolutionClosing = page.locator(
    '[data-empathy-resolution-closing]'
  )
  const introductionTrack = page.locator(
    '[data-three-in-one-intro-track]'
  )
  await expect(section).toHaveCount(1, { timeout: 15_000 })
  await expect(resolution).toHaveCount(1)
  await expect(resolutionTrack).toHaveCount(1)
  await expect(introductionTrack).toHaveCount(1)

  const trackGeometry = await resolutionTrack.evaluate(
    element => ({
      height: element.getBoundingClientRect().height,
      top: element.getBoundingClientRect().top + scrollY
    })
  )
  const introGeometry = await introductionTrack.evaluate(
    element => ({
      height: element.getBoundingClientRect().height,
      top: element.getBoundingClientRect().top + scrollY
    })
  )

  await page.evaluate(
    y => window.scrollTo(0, y),
    trackGeometry.top
  )
  await page.waitForTimeout(100)

  await expect(resolutionClosing).toHaveCSS('opacity', '0')

  await page.evaluate(
    y => window.scrollTo(0, y),
    trackGeometry.top + 844 * 0.75
  )
  await page.waitForTimeout(100)

  await expect(resolutionClosing).toHaveCSS('opacity', '1')
  expect(
    await resolution.evaluate(
      element => element.getBoundingClientRect().top
    )
  ).toBeCloseTo(0, 0)

  await page.evaluate(
    y => window.scrollTo(0, y),
    introGeometry.top + introGeometry.height * 0.25
  )
  await page.waitForTimeout(100)

  const entering = await section.evaluate(element => {
    const transform = new DOMMatrix(
      getComputedStyle(element).transform
    )

    return {
      animationName: getComputedStyle(element).animationName,
      left: element.getBoundingClientRect().left,
      top: element.getBoundingClientRect().top,
      translateY: transform.m42,
      visibility: getComputedStyle(element).visibility
    }
  })
  const heldResolutionTop = await resolution.evaluate(
    element => element.getBoundingClientRect().top
  )

  await page.evaluate(
    y => window.scrollTo(0, y),
    introGeometry.top + introGeometry.height * 0.5
  )
  await page.waitForTimeout(100)

  const settled = await section.evaluate(element => ({
    left: element.getBoundingClientRect().left,
    top: element.getBoundingClientRect().top,
    visibility: getComputedStyle(element).visibility
  }))

  expect(entering.animationName).toContain(
    'three-in-one-section-entry'
  )
  expect(entering.visibility).toBe('visible')
  expect(entering.left).toBeGreaterThan(20)
  expect(Math.abs(entering.top)).toBeLessThanOrEqual(2)
  expect(Math.abs(entering.translateY)).toBeLessThanOrEqual(0.1)
  expect(Math.abs(heldResolutionTop)).toBeLessThanOrEqual(2)
  expect(settled.visibility).toBe('visible')
  expect(Math.abs(settled.left)).toBeLessThanOrEqual(1)
  expect(Math.abs(settled.top)).toBeLessThanOrEqual(2)
  expect(trackGeometry.height).toBeCloseTo(844 * 3, -1)
  expect(introGeometry.height).toBeCloseTo(844 * 2, -1)
})

test('keeps the route header fixed and available after the opening sequence', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const header = page.locator('header[data-site-header]')
  const cartButton = header.getByRole('button', {
    name: /handlekurv/i
  })

  await expect(header).toHaveCount(1, { timeout: 15_000 })
  await page
    .locator('[data-three-in-one-surface]')
    .scrollIntoViewIfNeeded()
  await expect(header).toHaveCSS('position', 'fixed')
  await expect(header).toBeInViewport()
  await expect(cartButton).toBeVisible()
})

test('moves the complete scene surface instead of animating the image frame', async ({
  page
}) => {
  await page.goto(landingUrl, { waitUntil: 'load' })

  const theatreLayers = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-mode-transition]:not([data-mode-transition="static"])'
      )
    ).map(scene => {
      const frame = scene.firstElementChild as HTMLElement | null
      const sceneStyles = getComputedStyle(scene)
      const frameStyles = frame ? getComputedStyle(frame) : null

      return {
        animationName: sceneStyles.animationName,
        clipPath: sceneStyles.clipPath,
        frameAnimationName: frameStyles?.animationName ?? null,
        transform: sceneStyles.transform,
        willChange: sceneStyles.willChange
      }
    })
  )

  expect(theatreLayers).toHaveLength(2)
  for (const layer of theatreLayers) {
    expect(layer.animationName).not.toBe('none')
    expect(layer.frameAnimationName).toBe('none')
    expect(layer.clipPath).toBe('none')
    expect(layer.transform).not.toBe('none')
    expect(layer.willChange).toContain('transform')
  }
})
