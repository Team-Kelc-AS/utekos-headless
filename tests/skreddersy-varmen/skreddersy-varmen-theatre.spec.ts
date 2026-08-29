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

test('keeps every intro phase calm and ordered', async ({
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
  const exitIndex = choreography.logo.keyframes.length - 1
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
  expect(
    choreography.logo.keyframes[exitIndex]?.transform
  ).not.toBe(
    choreography.logo.keyframes[landingIndex]?.transform
  )
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
  expect(choreography.hero.delay).toBeCloseTo(logoEnd, 0)
  expect(choreography.hero.delay).toBeLessThan(headerEnd)
  expect(choreography.hero.endTime).toBeGreaterThan(headerEnd)
})

test('brings the hero in immediately after the logo without revealing it early', async ({
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
    hero: 'visible'
  })

  expect(await readPhaseAt(5200)).toEqual({
    cloud: 'hidden',
    jungle: 'hidden',
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

  const textGeometry = await textTheatre.evaluate(element => {
    const rect = element.getBoundingClientRect()
    return {
      activeDistance: rect.height - innerHeight,
      documentTop: rect.top + scrollY,
      height: rect.height,
      viewportHeight: innerHeight
    }
  })

  expect(textGeometry.height).toBeCloseTo(
    textGeometry.viewportHeight * 5.6,
    0
  )

  const scrollTextTrack = async (
    progress: number,
    offset = 0
  ) => {
    await page.evaluate(
      ({ activeDistance, documentTop, offset, progress }) =>
        window.scrollTo(
          0,
          documentTop + activeDistance * progress + offset
        ),
      { ...textGeometry, offset, progress }
    )
    await page.waitForTimeout(100)
  }

  const readPosition = (
    locator: typeof recognition,
    axis: 'left' | 'top'
  ) =>
    locator.evaluate(
      (element, selectedAxis) => ({
        position: element.getBoundingClientRect()[selectedAxis],
        timingFunction:
          getComputedStyle(element).animationTimingFunction,
        visibility: getComputedStyle(element).visibility
      }),
      axis
    )

  await scrollTextTrack(0.22, textGeometry.viewportHeight * 0.2)
  const transition = await readPosition(recognition, 'left')
  await scrollTextTrack(0.22, textGeometry.viewportHeight)
  const transitionAfterOneViewport = await readPosition(
    recognition,
    'left'
  )
  await scrollTextTrack(0.47, 1)
  const settled = await readPosition(recognition, 'left')

  expect(transition.visibility).toBe('visible')
  expect(transition.position).toBeGreaterThan(390 * 0.6)
  expect(transition.position).toBeLessThan(390)
  expect(transition.timingFunction).toBe('linear')
  expect(transitionAfterOneViewport.position).toBeGreaterThan(0)
  expect(transitionAfterOneViewport.position).toBeLessThan(
    transition.position
  )
  expect(settled.visibility).toBe('visible')
  expect(Math.abs(settled.position)).toBeLessThanOrEqual(1)

  await scrollTextTrack(0.485, textGeometry.viewportHeight * 0.2)
  const bonfireCopyEntering = await readPosition(
    bonfireCopy,
    'top'
  )
  await scrollTextTrack(0.485, textGeometry.viewportHeight)
  const bonfireCopyAfterOneViewport = await readPosition(
    bonfireCopy,
    'top'
  )
  await scrollTextTrack(0.735, 1)
  const bonfireCopySettled = await readPosition(
    bonfireCopy,
    'top'
  )

  expect(bonfireCopyEntering.visibility).toBe('visible')
  expect(bonfireCopyEntering.position).toBeGreaterThan(844 * 0.6)
  expect(bonfireCopyEntering.position).toBeLessThan(844)
  expect(bonfireCopyEntering.timingFunction).toBe('linear')
  expect(bonfireCopyAfterOneViewport.position).toBeGreaterThan(0)
  expect(bonfireCopyAfterOneViewport.position).toBeLessThan(
    bonfireCopyEntering.position
  )
  expect(bonfireCopySettled.visibility).toBe('visible')
  expect(
    Math.abs(bonfireCopySettled.position)
  ).toBeLessThanOrEqual(1)

  await scrollTextTrack(0.75, textGeometry.viewportHeight * 0.2)
  const bonfirePanelEntering = await readPosition(
    firstMediaScene,
    'left'
  )
  await scrollTextTrack(0.75, textGeometry.viewportHeight)
  const bonfirePanelAfterOneViewport = await readPosition(
    firstMediaScene,
    'left'
  )
  await scrollTextTrack(1, 1)
  const bonfirePanelSettled = await readPosition(
    firstMediaScene,
    'left'
  )

  expect(bonfirePanelEntering.visibility).toBe('visible')
  expect(bonfirePanelEntering.position).toBeGreaterThan(
    390 * 0.6
  )
  expect(bonfirePanelEntering.position).toBeLessThan(390)
  expect(bonfirePanelEntering.timingFunction).toBe('linear')
  expect(bonfirePanelAfterOneViewport.position).toBeGreaterThan(
    0
  )
  expect(bonfirePanelAfterOneViewport.position).toBeLessThan(
    bonfirePanelEntering.position
  )
  expect(bonfirePanelSettled.visibility).toBe('visible')
  expect(
    Math.abs(bonfirePanelSettled.position)
  ).toBeLessThanOrEqual(1)

  await page.evaluate(
    ({ documentTop, height }) =>
      window.scrollTo(
        0,
        documentTop + height - innerHeight * 0.8
      ),
    textGeometry
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

    for (let progress = 0; progress <= 6; progress += 0.25) {
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

test('reveals the first large empathy scene beneath the hero like a theatre curtain', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const geometry = await page.evaluate(() => {
    const heroPromotion = document.querySelector<HTMLElement>(
      '[class*="heroPromotion"]'
    )
    const heroSticky = heroPromotion?.querySelector<HTMLElement>(
      '[class*="heroSticky"]'
    )
    const heroClip = document.querySelector<HTMLElement>(
      '[data-hero-reveal-surface]'
    )
    const empathyPromotion = document.querySelector<HTMLElement>(
      '[data-empathy-promotion]'
    )
    const moment = document.querySelector<HTMLElement>(
      '[data-empathy-large-scene="moment"]'
    )

    if (
      !heroPromotion ||
      !heroSticky ||
      !heroClip ||
      !empathyPromotion ||
      !moment
    ) {
      throw new Error('Missing large curtain surfaces')
    }

    return {
      heroHeight: heroPromotion.getBoundingClientRect().height,
      heroStickyPosition: getComputedStyle(heroSticky).position,
      heroAnimationName:
        getComputedStyle(heroClip).animationName,
      empathyTop:
        empathyPromotion.getBoundingClientRect().top + scrollY,
      momentTop: moment.getBoundingClientRect().top
    }
  })

  expect(geometry.heroHeight).toBeCloseTo(1800, 0)
  expect(geometry.heroStickyPosition).toBe('sticky')
  expect(geometry.heroAnimationName).toContain(
    'skreddersy-hero-lift'
  )
  expect(geometry.empathyTop).toBeCloseTo(0, 0)

  const readCurtain = async (scrollTarget: number) => {
    await page.evaluate(y => window.scrollTo(0, y), scrollTarget)
    await page.evaluate(
      () =>
        new Promise<void>(resolve =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve())
          )
        )
    )

    return page.evaluate(() => {
      const hero = document.querySelector<HTMLElement>(
        '[data-hero-reveal-surface]'
      )
      const moment = document.querySelector<HTMLElement>(
        '[data-empathy-large-scene="moment"]'
      )
      const heading = document.querySelector<HTMLElement>(
        '[data-empathy-large-reveal-heading]'
      )
      const recognition = document.querySelector<HTMLElement>(
        '[data-empathy-large-scene="recognition"]'
      )

      if (!hero || !moment || !heading || !recognition) {
        throw new Error('Missing large curtain scene')
      }

      const hits = document.elementsFromPoint(
        innerWidth / 2,
        innerHeight / 2
      )
      const heroTransform = new DOMMatrix(
        getComputedStyle(hero).transform
      )
      const recognitionTransform = new DOMMatrix(
        getComputedStyle(recognition).transform
      )

      return {
        headingTop: heading.getBoundingClientRect().top,
        heroAtCenter: hits.some(hit => hero.contains(hit)),
        heroTranslateY: heroTransform.m42,
        momentAtCenter: hits.some(hit => moment.contains(hit)),
        recognitionTranslateX: recognitionTransform.m41,
        viewportWidth: innerWidth
      }
    })
  }

  const closed = await readCurtain(0)
  const halfOpen = await readCurtain(450)
  const open = await readCurtain(900)
  const nextSceneStarting = await readCurtain(990)

  expect(closed.heroAtCenter).toBe(true)
  expect(closed.heroTranslateY).toBeCloseTo(0, 0)
  expect(halfOpen.heroTranslateY).toBeLessThan(-350)
  expect(halfOpen.heroTranslateY).toBeGreaterThan(-550)
  expect(open.heroAtCenter).toBe(false)
  expect(open.momentAtCenter).toBe(true)
  expect(open.heroTranslateY).toBeCloseTo(-900, 0)
  expect(halfOpen.headingTop).toBeCloseTo(closed.headingTop, 0)
  expect(open.headingTop).toBeCloseTo(closed.headingTop, 0)
  expect(
    nextSceneStarting.recognitionTranslateX
  ).toBeGreaterThan(0)
  expect(nextSceneStarting.recognitionTranslateX).toBeLessThan(
    nextSceneStarting.viewportWidth * 0.9
  )
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
    documentTop: element.getBoundingClientRect().top + scrollY,
    height: element.getBoundingClientRect().height,
    viewportHeight: innerHeight
  }))

  expect(geometry.height).toBeCloseTo(
    geometry.viewportHeight * 8,
    0
  )

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

  await scrollToProgress(0.09)
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

  await scrollToProgress(0.2)
  const answerEntering = await answer.evaluate(element => ({
    left: element.getBoundingClientRect().left,
    timingFunction:
      getComputedStyle(element).animationTimingFunction,
    visibility: getComputedStyle(element).visibility
  }))

  expect(answerEntering.visibility).toBe('visible')
  expect(answerEntering.left).toBeGreaterThan(390 * 0.75)
  expect(answerEntering.left).toBeLessThan(390)
  expect(answerEntering.timingFunction).toBe('linear')

  await page.evaluate(
    ({ activeDistance, documentTop, viewportHeight }) =>
      window.scrollTo(
        0,
        documentTop + activeDistance * 0.18 + viewportHeight
      ),
    geometry
  )
  await page.waitForTimeout(100)

  const answerAfterOneViewport = await answer.evaluate(
    element => ({ left: element.getBoundingClientRect().left })
  )

  expect(answerAfterOneViewport.left).toBeGreaterThan(0)
  expect(answerAfterOneViewport.left).toBeLessThan(
    answerEntering.left
  )

  await scrollToProgress(0.341)
  expect(
    Math.abs(
      await answer.evaluate(
        element => element.getBoundingClientRect().left
      )
    )
  ).toBeLessThanOrEqual(1)

  await scrollToProgress(0.4)
  await expect(steps.nth(0)).toHaveCSS('opacity', '0')
  await expect(steps.nth(1)).toHaveCSS('opacity', '0')
  await expect(steps.nth(2)).toHaveCSS('opacity', '0')

  await scrollToProgress(0.601)
  await expect(steps.nth(0)).toHaveCSS('opacity', '1')
  await expect(steps.nth(1)).toHaveCSS('opacity', '0')
  await expect(steps.nth(2)).toHaveCSS('opacity', '0')

  await page.evaluate(
    ({ activeDistance, documentTop, viewportHeight }) =>
      window.scrollTo(
        0,
        documentTop + activeDistance * 0.599 + viewportHeight
      ),
    geometry
  )
  await page.waitForTimeout(100)

  const afterHardScroll = await steps.evaluateAll(elements =>
    elements.map(element =>
      Number.parseFloat(getComputedStyle(element).opacity)
    )
  )

  expect(afterHardScroll[0]).toBe(1)
  expect(afterHardScroll[1]).toBeGreaterThan(0)
  expect(afterHardScroll[1]).toBeLessThan(1)
  expect(afterHardScroll[2]).toBe(0)

  await scrollToProgress(0.771)
  await expect(steps.nth(0)).toHaveCSS('opacity', '1')
  await expect(steps.nth(1)).toHaveCSS('opacity', '1')
  await expect(steps.nth(2)).toHaveCSS('opacity', '0')

  await scrollToProgress(0.941)
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

test('keeps the technology heading controlled across responsive sizes', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const heading = page.locator('#techdown-heading')
  await expect(heading).toHaveCount(1, { timeout: 15_000 })

  const viewports = [
    { width: 390, height: 844, fontSize: 45.6 },
    { width: 834, height: 1112, fontSize: 62.55 },
    { width: 1280, height: 900, fontSize: 84 }
  ]

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)

    const geometry = await heading.evaluate(element => {
      const rect = element.getBoundingClientRect()
      return {
        documentWidth: document.documentElement.scrollWidth,
        fontSize: Number.parseFloat(
          getComputedStyle(element).fontSize
        ),
        height: rect.height,
        viewportWidth: innerWidth
      }
    })

    expect(geometry.fontSize).toBeCloseTo(viewport.fontSize, 0)
    expect(geometry.height).toBeLessThan(250)
    expect(geometry.documentWidth).toBe(geometry.viewportWidth)
  }
})

test('keeps the material result heading subordinate across responsive sizes', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const heading = page.locator('[data-techdown-instrument] h3')
  await expect(heading).toHaveText('Bevarer spenst og loft', {
    timeout: 15_000
  })

  const viewports = [
    { width: 390, height: 844, fontSize: 24 },
    { width: 834, height: 1112, fontSize: 27.105 },
    { width: 1280, height: 900, fontSize: 41.6 }
  ]

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)

    const geometry = await heading.evaluate(element => {
      const rect = element.getBoundingClientRect()
      return {
        documentWidth: document.documentElement.scrollWidth,
        fontSize: Number.parseFloat(
          getComputedStyle(element).fontSize
        ),
        height: rect.height,
        viewportWidth: innerWidth
      }
    })

    expect(geometry.fontSize).toBeCloseTo(viewport.fontSize, 0)
    expect(geometry.height).toBeLessThan(100)
    expect(geometry.documentWidth).toBe(geometry.viewportWidth)
  }
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
      activeDistance:
        element.getBoundingClientRect().height - innerHeight,
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
    ({ activeDistance, top }) =>
      window.scrollTo(0, top + activeDistance * 0.45 + 1),
    trackGeometry
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

test('keeps a transparent mobile header in the hero and clears it before the story images', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(landingUrl, { waitUntil: 'domcontentloaded' })

  const header = page.locator('header[data-site-header]')
  const icon = header.locator('img[src="/IconWhite.svg"]')
  const cartButton = header.getByRole('button', {
    name: /handlekurv/i
  })
  const menuButton = header.getByRole('button', {
    name: /åpne meny/i
  })

  await expect(header).toHaveCount(1, { timeout: 15_000 })
  await expect(icon).toBeVisible({ timeout: 5200 })
  await expect(cartButton).toBeVisible()
  await expect(menuButton).toBeVisible()
  await expect(header).toHaveCSS('position', 'fixed')

  const heroHeader = await header.evaluate(element => ({
    background: getComputedStyle(element).backgroundColor,
    beforeContent: getComputedStyle(element, '::before').content,
    searchButtons: Array.from(
      element.querySelectorAll('button')
    ).filter(
      button =>
        button.getAttribute('aria-label')?.includes('søk') &&
        getComputedStyle(button).display !== 'none'
    ).length
  }))

  expect(heroHeader.background).toBe('rgba(0, 0, 0, 0)')
  expect(heroHeader.beforeContent).toBe('none')
  expect(heroHeader.searchButtons).toBe(0)

  await page.evaluate(() => window.scrollTo(0, innerHeight + 1))
  await page.waitForTimeout(100)

  const storyHeader = await header.evaluate(element => ({
    bottom: element.getBoundingClientRect().bottom,
    opacity: getComputedStyle(element).opacity,
    visibility: getComputedStyle(element).visibility
  }))

  expect(storyHeader.bottom).toBeLessThanOrEqual(1)
  expect(storyHeader.opacity).toBe('0')
  expect(storyHeader.visibility).toBe('hidden')
})

test('paces both mobile mode arrivals linearly across more than one viewport', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const track = page
    .locator('[data-mode-scene="fullengde"]')
    .locator('..')
    .locator('..')
  await expect(track).toHaveCount(1, { timeout: 15_000 })

  const geometry = await track.evaluate(element => {
    const rect = element.getBoundingClientRect()
    return {
      activeDistance: rect.height - innerHeight,
      documentTop: rect.top + scrollY,
      height: rect.height,
      viewportHeight: innerHeight
    }
  })

  expect(geometry.height).toBeCloseTo(
    geometry.viewportHeight * 3.6,
    0
  )

  const readTransform = async (
    selector: string,
    progress: number,
    offset = 0
  ) => {
    await page.evaluate(
      ({ activeDistance, documentTop, offset, progress }) =>
        window.scrollTo(
          0,
          documentTop + activeDistance * progress + offset
        ),
      { ...geometry, offset, progress }
    )
    await page.waitForTimeout(100)

    return page.locator(selector).evaluate(element => {
      const matrix = new DOMMatrix(
        getComputedStyle(element).transform
      )
      return {
        timingFunction:
          getComputedStyle(element).animationTimingFunction,
        x: matrix.m41,
        y: matrix.m42
      }
    })
  }

  const verticalEarly = await readTransform(
    '[data-mode-scene="oppjustert"]',
    0.02,
    geometry.viewportHeight * 0.2
  )
  const verticalAfterOneViewport = await readTransform(
    '[data-mode-scene="oppjustert"]',
    0.02,
    geometry.viewportHeight
  )
  const verticalComplete = await readTransform(
    '[data-mode-scene="oppjustert"]',
    0.45,
    1
  )

  expect(verticalEarly.y).toBeGreaterThan(844 * 0.6)
  expect(verticalEarly.y).toBeLessThan(844)
  expect(verticalEarly.timingFunction).toBe('linear')
  expect(verticalAfterOneViewport.y).toBeGreaterThan(0)
  expect(verticalAfterOneViewport.y).toBeLessThan(
    verticalEarly.y
  )
  expect(verticalComplete.y).toBeCloseTo(0, 1)

  const horizontalEarly = await readTransform(
    '[data-mode-scene="parkas"]',
    0.48,
    geometry.viewportHeight * 0.2
  )
  const horizontalAfterOneViewport = await readTransform(
    '[data-mode-scene="parkas"]',
    0.48,
    geometry.viewportHeight
  )
  const horizontalComplete = await readTransform(
    '[data-mode-scene="parkas"]',
    0.91,
    1
  )

  expect(horizontalEarly.x).toBeGreaterThan(390 * 0.6)
  expect(horizontalEarly.x).toBeLessThan(390)
  expect(horizontalEarly.timingFunction).toBe('linear')
  expect(horizontalAfterOneViewport.x).toBeGreaterThan(0)
  expect(horizontalAfterOneViewport.x).toBeLessThan(
    horizontalEarly.x
  )
  expect(horizontalComplete.x).toBeCloseTo(0, 1)
})

test('keeps mobile mode images flush with their 4:5 frames on narrow screens', async ({
  page
}) => {
  test.setTimeout(45_000)

  const viewports = [
    { width: 390, height: 1102 },
    { width: 320, height: 568 },
    { width: 240, height: 422 }
  ]

  await page.setViewportSize(viewports[0]!)
  await page.goto(landingUrl, { waitUntil: 'load' })

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(100)

    const scene = page.locator('[data-mode-scene="oppjustert"]')
    const track = scene.locator('..').locator('..')
    await expect(scene).toHaveCount(1, { timeout: 15_000 })

    const geometry = await track.evaluate(element => {
      const rect = element.getBoundingClientRect()
      return {
        activeDistance: rect.height - innerHeight,
        documentTop: rect.top + scrollY
      }
    })

    await page.evaluate(
      ({ activeDistance, documentTop }) =>
        window.scrollTo(
          0,
          documentTop + activeDistance * 0.45 + 1
        ),
      geometry
    )
    await page.waitForTimeout(100)

    const image = scene.locator('img')
    await expect
      .poll(
        () =>
          image.evaluate(element => {
            const modeImage = element as HTMLImageElement
            return (
              modeImage.complete && modeImage.naturalWidth > 0
            )
          }),
        { timeout: 15_000 }
      )
      .toBe(true)
    await expect(image).toHaveCSS('object-fit', 'cover', {
      timeout: 15_000
    })

    const state = await scene.evaluate(element => {
      const shell = element.firstElementChild
      const core = shell?.firstElementChild
      const picture = core?.firstElementChild
      const image = picture?.querySelector('img')

      if (!shell || !core || !picture || !image) {
        throw new Error('Missing mobile mode image composition')
      }

      const readRect = (node: Element) => {
        const rect = node.getBoundingClientRect()
        return {
          height: rect.height,
          ratio: rect.width / rect.height,
          width: rect.width
        }
      }

      return {
        core: readRect(core),
        documentWidth: document.documentElement.scrollWidth,
        image: readRect(image),
        imageComplete: image.complete,
        naturalWidth: image.naturalWidth,
        objectFit: getComputedStyle(image).objectFit,
        picture: readRect(picture),
        shell: readRect(shell),
        viewportWidth: innerWidth
      }
    })

    expect(state.objectFit).toBe('cover')
    expect(state.imageComplete).toBe(true)
    expect(state.naturalWidth).toBeGreaterThan(0)
    expect(state.documentWidth).toBe(state.viewportWidth)
    expect(state.core.ratio).toBeCloseTo(4 / 5, 2)
    expect(state.picture.ratio).toBeCloseTo(4 / 5, 2)
    expect(state.image.ratio).toBeCloseTo(4 / 5, 2)
    expect(state.shell.ratio).toBeGreaterThanOrEqual(0.8)
    expect(state.shell.ratio).toBeLessThan(0.82)
    expect(
      Math.abs(state.core.width - state.picture.width)
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs(state.core.height - state.picture.height)
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs(state.picture.width - state.image.width)
    ).toBeLessThanOrEqual(1)
    expect(
      Math.abs(state.picture.height - state.image.height)
    ).toBeLessThanOrEqual(1)
  }
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

test('switches from the locked mobile story to the isolated large story at 768px', async ({
  page
}) => {
  for (const width of [767, 768]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(landingUrl, { waitUntil: 'load' })

    const state = await page.evaluate(() => {
      const mobile = document.querySelector<HTMLElement>(
        '[data-empathy-mobile]'
      )
      const large = document.querySelector<HTMLElement>(
        '[data-empathy-large]'
      )
      const mobileHeading = document.querySelector<HTMLElement>(
        '#empathy-heading'
      )
      const largeHeading = document.querySelector<HTMLElement>(
        '#empathy-heading-large'
      )

      if (!mobile || !large || !mobileHeading || !largeHeading) {
        throw new Error('Missing responsive empathy variants')
      }

      return {
        largeDisplay: getComputedStyle(large).display,
        largeHeadingDisplay:
          getComputedStyle(largeHeading).display,
        mobileDisplay: getComputedStyle(mobile).display,
        mobileHeadingDisplay:
          getComputedStyle(mobileHeading).display,
        sentinelCount: document.querySelectorAll(
          '[data-empathy-impression-sentinel]'
        ).length
      }
    })

    expect(state.sentinelCount).toBe(1)

    if (width < 768) {
      expect(state.mobileDisplay).not.toBe('none')
      expect(state.mobileHeadingDisplay).not.toBe('none')
      expect(state.largeDisplay).toBe('none')
    } else {
      expect(state.mobileDisplay).toBe('none')
      expect(state.largeDisplay).not.toBe('none')
      expect(state.largeHeadingDisplay).not.toBe('none')
    }
  }
})

test('reveals the fixed large empathy frames diagonally and keeps exact corner contact', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const geometry = await page.evaluate(() => {
    const bonfire = document.querySelector<HTMLElement>(
      '[data-empathy-large-media-scene="bonfire"]'
    )
    const chill = document.querySelector<HTMLElement>(
      '[data-empathy-large-media-scene="chill"]'
    )

    if (!bonfire || !chill) {
      throw new Error('Missing large empathy media rows')
    }

    const bonfireRect = bonfire.getBoundingClientRect()
    const chillRect = chill.getBoundingClientRect()

    return {
      bonfireHeight: bonfireRect.height,
      bonfireTop: bonfireRect.top + scrollY,
      chillHeight: chillRect.height,
      chillTop: chillRect.top + scrollY
    }
  })

  const readReveal = async (scrollTarget: number) => {
    await page.evaluate(y => window.scrollTo(0, y), scrollTarget)
    await page.evaluate(
      () =>
        new Promise<void>(resolve =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve())
          )
        )
    )

    return page.evaluate(() => {
      const bonfire = document.querySelector<HTMLElement>(
        '[data-empathy-large-reveal-frame="bonfire"]'
      )
      const chill = document.querySelector<HTMLElement>(
        '[data-empathy-large-reveal-frame="chill"]'
      )
      const horizontal = bonfire?.querySelector<HTMLElement>(
        '[data-empathy-large-reveal-cover="horizontal"]'
      )
      const vertical = bonfire?.querySelector<HTMLElement>(
        '[data-empathy-large-reveal-cover="vertical"]'
      )
      const chillHorizontal = chill?.querySelector<HTMLElement>(
        '[data-empathy-large-reveal-cover="horizontal"]'
      )
      const chillVertical = chill?.querySelector<HTMLElement>(
        '[data-empathy-large-reveal-cover="vertical"]'
      )
      const image =
        bonfire?.querySelector<HTMLImageElement>('img')

      if (
        !bonfire ||
        !chill ||
        !horizontal ||
        !vertical ||
        !chillHorizontal ||
        !chillVertical ||
        !image
      ) {
        throw new Error('Missing large empathy reveal surfaces')
      }

      const first = bonfire.getBoundingClientRect()
      const second = chill.getBoundingClientRect()
      const horizontalMatrix = new DOMMatrix(
        getComputedStyle(horizontal).transform
      )
      const verticalMatrix = new DOMMatrix(
        getComputedStyle(vertical).transform
      )
      const chillHorizontalMatrix = new DOMMatrix(
        getComputedStyle(chillHorizontal).transform
      )
      const chillVerticalMatrix = new DOMMatrix(
        getComputedStyle(chillVertical).transform
      )
      const frameStyle = getComputedStyle(bonfire)
      const imageStyle = getComputedStyle(image)

      return {
        chillHorizontalScale: chillHorizontalMatrix.a,
        chillVerticalScale: chillVerticalMatrix.d,
        contactX: second.left - first.right,
        contactY: second.top - first.bottom,
        firstBottom: first.bottom,
        firstHeight: first.height,
        firstTop: first.top,
        firstWidth: first.width,
        frameClipPath: frameStyle.clipPath,
        frameOpacity: frameStyle.opacity,
        frameTransform: frameStyle.transform,
        horizontalScale: horizontalMatrix.a,
        imageObjectFit: imageStyle.objectFit,
        imageSource: image.currentSrc,
        verticalScale: verticalMatrix.d
      }
    })
  }

  const start = await readReveal(geometry.bonfireTop - 900 * 0.8)
  const middle = await readReveal(geometry.bonfireTop)
  const complete = await readReveal(
    geometry.bonfireTop + geometry.bonfireHeight * 0.3
  )

  expect(start.horizontalScale).toBeGreaterThan(0.5)
  expect(start.horizontalScale).toBeLessThan(1)
  expect(start.verticalScale).toBeGreaterThan(0.5)
  expect(start.verticalScale).toBeLessThan(1)
  expect(middle.horizontalScale).toBeGreaterThan(0)
  expect(middle.horizontalScale).toBeLessThan(
    start.horizontalScale
  )
  expect(middle.verticalScale).toBeGreaterThan(0)
  expect(middle.verticalScale).toBeLessThan(start.verticalScale)
  expect(complete.horizontalScale).toBeCloseTo(0, 2)
  expect(complete.verticalScale).toBeCloseTo(0, 2)
  expect(complete.firstWidth / complete.firstHeight).toBeCloseTo(
    4 / 5,
    3
  )
  expect(complete.contactX).toBeCloseTo(0, 1)
  expect(complete.contactY).toBeCloseTo(0, 1)
  expect(complete.frameTransform).toBe('none')
  expect(complete.frameOpacity).toBe('1')
  expect(complete.frameClipPath).toBe('none')
  expect(complete.imageObjectFit).toBe('cover')
  expect(complete.imageSource).toContain('SkreddersyVarmen-1')
  expect(start.firstWidth).toBeCloseTo(complete.firstWidth, 1)
  expect(start.firstHeight).toBeCloseTo(complete.firstHeight, 1)

  const handoffScroll =
    geometry.bonfireTop + geometry.bonfireHeight * 0.3
  const beforeHandoff = await readReveal(
    handoffScroll - geometry.bonfireHeight * 0.05
  )
  const handoff = await readReveal(handoffScroll)
  const chillMiddle = await readReveal(
    geometry.bonfireTop + geometry.bonfireHeight * 0.65
  )
  const chillComplete = await readReveal(
    geometry.bonfireTop + geometry.bonfireHeight
  )

  expect(beforeHandoff.horizontalScale).toBeGreaterThan(0)
  expect(beforeHandoff.verticalScale).toBeGreaterThan(0)
  expect(beforeHandoff.chillHorizontalScale).toBeCloseTo(1, 2)
  expect(beforeHandoff.chillVerticalScale).toBeCloseTo(1, 2)
  expect(handoff.horizontalScale).toBeCloseTo(0, 2)
  expect(handoff.verticalScale).toBeCloseTo(0, 2)
  expect(handoff.chillHorizontalScale).toBeCloseTo(1, 2)
  expect(handoff.chillVerticalScale).toBeCloseTo(1, 2)
  expect(chillMiddle.chillHorizontalScale).toBeGreaterThan(0)
  expect(chillMiddle.chillHorizontalScale).toBeLessThan(1)
  expect(chillMiddle.chillVerticalScale).toBeGreaterThan(0)
  expect(chillMiddle.chillVerticalScale).toBeLessThan(1)
  expect(chillComplete.chillHorizontalScale).toBeCloseTo(0, 2)
  expect(chillComplete.chillVerticalScale).toBeCloseTo(0, 2)

  const secondReveal = await readReveal(
    geometry.chillTop - 900 * 0.45
  )

  expect(secondReveal.firstTop).toBeLessThan(0)
  expect(secondReveal.firstBottom).toBeGreaterThan(0)
  expect(secondReveal.contactX).toBeCloseTo(0, 1)
  expect(secondReveal.contactY).toBeCloseTo(0, 1)
})

test('starts each large right-side transition promptly instead of leaving dead scroll space', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const geometry = await page.evaluate(() => {
    const textTrack = document.querySelector<HTMLElement>(
      '[data-empathy-large-text-theatre]'
    )
    const questionTrack = document.querySelector<HTMLElement>(
      '[data-empathy-large-question-answer-theatre]'
    )
    const resolutionTrack = document.querySelector<HTMLElement>(
      '[data-empathy-large-resolution-track]'
    )
    const modeTrack = document.querySelector<HTMLElement>(
      '[data-mode-scene="fullengde"]'
    )?.parentElement?.parentElement

    if (
      !textTrack ||
      !questionTrack ||
      !resolutionTrack ||
      !modeTrack
    ) {
      throw new Error('Missing large scroll tracks')
    }

    const readTrack = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect()
      return { height: rect.height, top: rect.top + scrollY }
    }

    return {
      mode: readTrack(modeTrack),
      question: readTrack(questionTrack),
      resolution: readTrack(resolutionTrack),
      text: readTrack(textTrack),
      viewportHeight: innerHeight
    }
  })

  expect(geometry.text.height).toBeCloseTo(
    geometry.viewportHeight * 4,
    0
  )
  expect(geometry.question.height).toBeCloseTo(
    geometry.viewportHeight * 6.5,
    0
  )
  expect(geometry.resolution.height).toBeCloseTo(
    geometry.viewportHeight * 2.6,
    0
  )
  expect(geometry.mode.height).toBeCloseTo(
    geometry.viewportHeight * 3.8,
    0
  )

  const readTransform = async (
    selector: string,
    scrollTarget: number
  ) => {
    await page.evaluate(y => window.scrollTo(0, y), scrollTarget)
    await page.evaluate(
      () =>
        new Promise<void>(resolve =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve())
          )
        )
    )

    return page.evaluate(target => {
      const surface = document.querySelector<HTMLElement>(target)
      if (!surface)
        throw new Error(`Missing transition surface: ${target}`)

      const matrix = new DOMMatrix(
        getComputedStyle(surface).transform
      )
      return {
        timingFunction:
          getComputedStyle(surface).animationTimingFunction,
        x: matrix.m41,
        y: matrix.m42
      }
    }, selector)
  }

  const questionDistance = geometry.viewportHeight * (6.5 - 1)
  const answerStart =
    geometry.question.top + questionDistance * 0.03
  const answerEarly = await readTransform(
    '[data-empathy-large-answer-panel]',
    answerStart + geometry.viewportHeight * 0.2
  )
  const answerOneViewport = await readTransform(
    '[data-empathy-large-answer-panel]',
    answerStart + geometry.viewportHeight
  )
  const answerComplete = await readTransform(
    '[data-empathy-large-answer-panel]',
    geometry.question.top + questionDistance * 0.25 + 1
  )

  expect(answerEarly.x).toBeGreaterThan(1440 * 0.6)
  expect(answerEarly.x).toBeLessThan(1440)
  expect(answerEarly.timingFunction).toBe('linear')
  expect(answerOneViewport.x).toBeGreaterThan(0)
  expect(answerOneViewport.x).toBeLessThan(answerEarly.x)
  expect(answerComplete.x).toBeCloseTo(0, 1)

  const readAnswerSequence = async (progress: number) => {
    await page.evaluate(
      ({ top, distance, progress }) =>
        window.scrollTo(0, top + distance * progress),
      {
        distance: questionDistance,
        progress,
        top: geometry.question.top
      }
    )
    await page.evaluate(
      () =>
        new Promise<void>(resolve =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve())
          )
        )
    )

    return page.evaluate(() => {
      const panel = document.querySelector<HTMLElement>(
        '[data-empathy-large-answer-panel]'
      )
      const stepElements = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-empathy-large-answer-step]'
        )
      )

      if (!panel || stepElements.length !== 3) {
        throw new Error('Missing large answer sequence')
      }

      return {
        panelLeft: panel.getBoundingClientRect().left,
        stepOpacities: stepElements.map(element =>
          Number.parseFloat(getComputedStyle(element).opacity)
        )
      }
    })
  }

  const headingOnly = await readAnswerSequence(0.31)
  expect(Math.abs(headingOnly.panelLeft)).toBeLessThanOrEqual(1)
  expect(headingOnly.stepOpacities).toEqual([0, 0, 0])

  const firstComplete = await readAnswerSequence(0.561)
  expect(firstComplete.stepOpacities).toEqual([1, 0, 0])

  const hardScrollProgress =
    0.559 + geometry.viewportHeight / questionDistance
  const afterLargeHardScroll = await readAnswerSequence(
    hardScrollProgress
  )
  expect(afterLargeHardScroll.stepOpacities[0]).toBe(1)
  expect(afterLargeHardScroll.stepOpacities[1]).toBeGreaterThan(
    0
  )
  expect(afterLargeHardScroll.stepOpacities[1]).toBeLessThan(1)
  expect(afterLargeHardScroll.stepOpacities[2]).toBe(0)

  const secondComplete = await readAnswerSequence(0.761)
  expect(secondComplete.stepOpacities).toEqual([1, 1, 0])

  const thirdComplete = await readAnswerSequence(0.961)
  expect(thirdComplete.stepOpacities).toEqual([1, 1, 1])

  const modeDistance = geometry.viewportHeight * (3.8 - 1)
  const verticalStart = geometry.mode.top + modeDistance * 0.02
  const verticalEarly = await readTransform(
    '[data-mode-scene="oppjustert"]',
    verticalStart + geometry.viewportHeight * 0.2
  )
  const verticalOneViewport = await readTransform(
    '[data-mode-scene="oppjustert"]',
    verticalStart + geometry.viewportHeight
  )
  const verticalComplete = await readTransform(
    '[data-mode-scene="oppjustert"]',
    geometry.mode.top + modeDistance * 0.45 + 1
  )

  expect(verticalEarly.y).toBeGreaterThan(900 * 0.6)
  expect(verticalEarly.y).toBeLessThan(900)
  expect(verticalEarly.timingFunction).toBe('linear')
  expect(verticalOneViewport.y).toBeGreaterThan(0)
  expect(verticalOneViewport.y).toBeLessThan(verticalEarly.y)
  expect(verticalComplete.y).toBeCloseTo(0, 1)

  const horizontalStart = geometry.mode.top + modeDistance * 0.48
  const horizontalEarly = await readTransform(
    '[data-mode-scene="parkas"]',
    horizontalStart + geometry.viewportHeight * 0.2
  )
  const horizontalOneViewport = await readTransform(
    '[data-mode-scene="parkas"]',
    horizontalStart + geometry.viewportHeight
  )
  const horizontalComplete = await readTransform(
    '[data-mode-scene="parkas"]',
    geometry.mode.top + modeDistance * 0.91 + 1
  )

  expect(horizontalEarly.x).toBeGreaterThan(1440 * 0.6)
  expect(horizontalEarly.x).toBeLessThan(1440)
  expect(horizontalEarly.timingFunction).toBe('linear')
  expect(horizontalOneViewport.x).toBeGreaterThan(0)
  expect(horizontalOneViewport.x).toBeLessThan(horizontalEarly.x)
  expect(horizontalComplete.x).toBeCloseTo(0, 1)
})

test('keeps Friheten til a velge full width before the following 50/50 mode stage', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const geometry = await page.evaluate(() => {
    const track = document.querySelector<HTMLElement>(
      '[data-three-in-one-intro-track]'
    )
    if (!track)
      throw new Error('Missing three-in-one intro track')

    const rect = track.getBoundingClientRect()
    return { height: rect.height, top: rect.top + scrollY }
  })

  expect(geometry.height).toBeCloseTo(900 * 2.6, 0)

  await page.evaluate(
    y => window.scrollTo(0, y),
    geometry.top + 900 * 0.2
  )
  await page.waitForTimeout(100)

  const entering = await page.evaluate(() => {
    const surface = document.querySelector<HTMLElement>(
      '[data-three-in-one-surface]'
    )
    if (!surface) throw new Error('Missing three-in-one surface')

    const matrix = new DOMMatrix(
      getComputedStyle(surface).transform
    )
    return {
      clipPath: getComputedStyle(surface).clipPath,
      translateX: matrix.m41,
      translateY: matrix.m42
    }
  })

  expect(entering.translateX).toBeGreaterThan(1440 * 0.6)
  expect(entering.translateX).toBeLessThan(1440)
  expect(entering.translateY).toBeGreaterThan(0)
  expect(entering.clipPath).not.toBe('none')

  await page.evaluate(
    y => window.scrollTo(0, y),
    geometry.top + 900
  )
  await page.waitForTimeout(100)

  const oneViewport = await page.evaluate(() => {
    const surface = document.querySelector<HTMLElement>(
      '[data-three-in-one-surface]'
    )
    if (!surface) throw new Error('Missing three-in-one surface')

    const matrix = new DOMMatrix(
      getComputedStyle(surface).transform
    )
    return { translateX: matrix.m41, translateY: matrix.m42 }
  })

  expect(oneViewport.translateX).toBeGreaterThan(1440 * 0.1)
  expect(oneViewport.translateX).toBeLessThan(
    entering.translateX
  )
  expect(oneViewport.translateY).toBeGreaterThan(0)

  await page.evaluate(
    y => window.scrollTo(0, y),
    geometry.top + (geometry.height - 900) * 0.88 + 1
  )
  await page.waitForTimeout(100)

  const rangeSettled = await page.evaluate(() => {
    const surface = document.querySelector<HTMLElement>(
      '[data-three-in-one-surface]'
    )
    if (!surface) throw new Error('Missing three-in-one surface')

    const matrix = new DOMMatrix(
      getComputedStyle(surface).transform
    )
    return { translateX: matrix.m41, translateY: matrix.m42 }
  })

  expect(rangeSettled.translateX).toBeCloseTo(0, 1)
  expect(rangeSettled.translateY).toBeCloseTo(0, 1)

  await page.evaluate(
    y => window.scrollTo(0, y),
    geometry.top + geometry.height - 900
  )
  await page.waitForTimeout(100)

  const settled = await page.evaluate(() => {
    const surface = document.querySelector<HTMLElement>(
      '[data-three-in-one-surface]'
    )
    const content =
      surface?.firstElementChild as HTMLElement | null
    const resolution = document.querySelector<HTMLElement>(
      '[data-empathy-large-resolution]'
    )
    const firstMode = document.querySelector<HTMLElement>(
      '[data-mode-scene="fullengde"]'
    )
    const stage = firstMode?.parentElement
    const eyebrow = content?.querySelector<HTMLElement>('p')

    if (
      !surface ||
      !content ||
      !resolution ||
      !stage ||
      !eyebrow
    ) {
      throw new Error('Missing large introduction composition')
    }

    const surfaceStyle = getComputedStyle(surface)
    const resolutionStyle = getComputedStyle(resolution)
    const surfaceRect = surface.getBoundingClientRect()
    const primaryProbe = document.createElement('span')
    primaryProbe.style.color = 'var(--primary)'
    document.body.append(primaryProbe)
    const primaryColor = getComputedStyle(primaryProbe).color
    primaryProbe.remove()

    return {
      contentWidth: content.getBoundingClientRect().width,
      eyebrowColor: getComputedStyle(eyebrow).color,
      primaryColor,
      resolutionBackground: resolutionStyle.backgroundColor,
      stageBackground: getComputedStyle(stage).backgroundImage,
      surfaceBackground: surfaceStyle.backgroundColor,
      surfaceBackgroundImage: surfaceStyle.backgroundImage,
      surfaceLeft: surfaceRect.left,
      surfaceWidth: surfaceRect.width,
      viewportWidth: innerWidth
    }
  })

  expect(settled.surfaceLeft).toBeCloseTo(0, 0)
  expect(settled.surfaceWidth).toBeCloseTo(
    settled.viewportWidth,
    0
  )
  expect(settled.contentWidth).toBeGreaterThan(
    settled.viewportWidth * 0.75
  )
  expect(settled.eyebrowColor).toBe(settled.primaryColor)
  expect(settled.surfaceBackgroundImage).toBe('none')
  expect(settled.surfaceBackground).not.toBe(
    settled.resolutionBackground
  )
  expect(settled.stageBackground).toContain('50%')
})

test('pins the desktop purchase gallery at the composed entry moment while details continue scrolling', async ({
  page
}) => {
  await page.setViewportSize({ width: 1920, height: 1243 })
  await page.goto(landingUrl, { waitUntil: 'load' })

  const section = page
    .locator('#purchase-section section')
    .first()
  const gallery = section.locator(':scope > div').first()
  const details = section.locator(':scope > div').nth(1)

  await expect(section).toHaveCount(1, { timeout: 15_000 })

  const sectionTop = await section.evaluate(
    element => element.getBoundingClientRect().top + scrollY
  )
  const stickyTop = 90

  await page.evaluate(
    ({ sectionTop, stickyTop }) =>
      window.scrollTo(0, sectionTop - stickyTop),
    { sectionTop, stickyTop }
  )
  await page.waitForTimeout(100)

  const entry = await page.evaluate(() => {
    const section = document.querySelector<HTMLElement>(
      '#purchase-section section'
    )
    const gallery =
      section?.firstElementChild as HTMLElement | null
    const details =
      gallery?.nextElementSibling as HTMLElement | null

    if (!section || !gallery || !details) {
      throw new Error('Missing desktop purchase composition')
    }

    return {
      detailsTop: details.getBoundingClientRect().top,
      galleryHeight: gallery.getBoundingClientRect().height,
      galleryPosition: getComputedStyle(gallery).position,
      galleryTop: gallery.getBoundingClientRect().top,
      sectionTop: section.getBoundingClientRect().top
    }
  })

  expect(entry.galleryPosition).toBe('sticky')
  expect(entry.galleryHeight).toBeCloseTo(1243, 0)
  expect(entry.sectionTop).toBeCloseTo(stickyTop, 0)
  expect(entry.galleryTop).toBeCloseTo(stickyTop, 0)
  expect(entry.detailsTop).toBeCloseTo(stickyTop, 0)

  await page.evaluate(
    ({ sectionTop }) => window.scrollTo(0, sectionTop + 210),
    { sectionTop }
  )
  await page.waitForTimeout(100)

  const scrolling = await Promise.all([
    gallery.evaluate(
      element => element.getBoundingClientRect().top
    ),
    details.evaluate(
      element => element.getBoundingClientRect().top
    )
  ])

  expect(scrolling[0]).toBeCloseTo(stickyTop, 0)
  expect(scrolling[1]).toBeCloseTo(-210, 0)
})

test('keeps large breakpoint layouts 50/50 with five real 4:5 image frames', async ({
  page
}) => {
  const viewports = [
    { width: 834, height: 1112 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 }
  ]

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto(landingUrl, { waitUntil: 'load' })

    const firstModeTop = await page.evaluate(() => {
      const scene = document.querySelector<HTMLElement>(
        '[data-mode-scene="fullengde"]'
      )
      if (!scene) throw new Error('Missing full-length scene')

      return scene.getBoundingClientRect().top + scrollY
    })

    await page.evaluate(y => window.scrollTo(0, y), firstModeTop)
    await page.waitForTimeout(100)

    const state = await page.evaluate(() => {
      const scene = document.querySelector<HTMLElement>(
        '[data-mode-scene="fullengde"]'
      )
      const media =
        scene?.firstElementChild as HTMLElement | null
      const copy =
        media?.nextElementSibling as HTMLElement | null
      const stage = scene?.parentElement
      const header = document.querySelector<HTMLElement>(
        'header[data-site-header]'
      )
      const pictures = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-mode-scene] [class*="picture"]'
        )
      )
      const empathyFrames = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-empathy-large-reveal-frame]'
        )
      )
      const images = Array.from(
        document.querySelectorAll<HTMLImageElement>(
          '[data-mode-scene] img'
        )
      )

      if (!scene || !media || !copy || !stage || !header) {
        throw new Error('Missing large mode composition')
      }

      const mediaRect = media.getBoundingClientRect()
      const copyRect = copy.getBoundingClientRect()

      return {
        activeLargeDisplay: getComputedStyle(
          document.querySelector<HTMLElement>(
            '[data-empathy-large]'
          )!
        ).display,
        activeMobileDisplay: getComputedStyle(
          document.querySelector<HTMLElement>(
            '[data-empathy-mobile]'
          )!
        ).display,
        boundary: mediaRect.right,
        copyLeft: copyRect.left,
        copyWidth: copyRect.width,
        documentWidth: document.documentElement.scrollWidth,
        empathyRatios: empathyFrames.map(frame => {
          const rect = frame.getBoundingClientRect()
          return rect.width / rect.height
        }),
        headerPosition: getComputedStyle(header).position,
        headerVisibility: getComputedStyle(header).visibility,
        h1Count: document.querySelectorAll('h1').length,
        imageFits: images.map(
          image => getComputedStyle(image).objectFit
        ),
        imageSources: images.map(
          image => image.getAttribute('src') ?? image.currentSrc
        ),
        mainCount: document.querySelectorAll('main').length,
        mediaWidth: mediaRect.width,
        modeRatios: pictures.map(picture => {
          const rect = picture.getBoundingClientRect()
          return rect.width / rect.height
        }),
        sentinelCount: document.querySelectorAll(
          '[data-empathy-impression-sentinel]'
        ).length,
        stageBackground: getComputedStyle(stage).backgroundImage,
        viewportWidth: innerWidth
      }
    })

    expect(state.activeMobileDisplay).toBe('none')
    expect(state.activeLargeDisplay).not.toBe('none')
    expect(state.mainCount).toBe(1)
    expect(state.h1Count).toBe(1)
    expect(state.sentinelCount).toBe(1)
    expect(state.headerPosition).toBe('fixed')
    expect(state.headerVisibility).toBe('hidden')
    expect(state.documentWidth).toBe(state.viewportWidth)
    expect(state.mediaWidth).toBeCloseTo(viewport.width / 2, 1)
    expect(state.copyWidth).toBeCloseTo(viewport.width / 2, 1)
    expect(state.boundary).toBeCloseTo(viewport.width / 2, 1)
    expect(state.copyLeft).toBeCloseTo(viewport.width / 2, 1)
    expect(state.stageBackground).toContain('50%')
    expect(state.empathyRatios).toHaveLength(2)
    expect(state.modeRatios).toHaveLength(3)

    for (const ratio of [
      ...state.empathyRatios,
      ...state.modeRatios
    ]) {
      expect(ratio).toBeCloseTo(4 / 5, 2)
    }

    expect(state.imageFits).toEqual(['cover', 'cover', 'cover'])
    expect(state.imageSources[0]).toContain(
      'TechDown-1080x1350-2'
    )
    expect(state.imageSources[1]).toContain('UtekosTechDownMob')
    expect(state.imageSources[2]).toContain(
      'TechDown-Kyst-W-1600x1600'
    )
  }
})

test('uses static large fallbacks for reduced motion and short viewports', async ({
  page
}) => {
  const cases = [
    {
      reducedMotion: 'reduce' as const,
      viewport: { width: 1440, height: 900 }
    },
    {
      reducedMotion: 'no-preference' as const,
      viewport: { width: 1024, height: 600 }
    }
  ]

  for (const testCase of cases) {
    await page.emulateMedia({
      reducedMotion: testCase.reducedMotion
    })
    await page.setViewportSize(testCase.viewport)
    await page.goto(landingUrl, { waitUntil: 'load' })

    const state = await page.evaluate(() => {
      const textSurface = document.querySelector<HTMLElement>(
        '[data-empathy-large-reveal-surface]'
      )
      const answerSurface = document.querySelector<HTMLElement>(
        '[data-empathy-large-question-answer-sticky]'
      )
      const resolution = document.querySelector<HTMLElement>(
        '[data-empathy-large-resolution]'
      )
      const covers = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-empathy-large-reveal-cover]'
        )
      )
      const scenes = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-mode-scene]'
        )
      )

      if (!textSurface || !answerSurface || !resolution) {
        throw new Error('Missing large fallback surfaces')
      }

      return {
        answerPosition: getComputedStyle(answerSurface).position,
        coverDisplays: covers.map(
          cover => getComputedStyle(cover).display
        ),
        resolutionPosition:
          getComputedStyle(resolution).position,
        scenePositions: scenes.map(
          scene => getComputedStyle(scene).position
        ),
        sceneTransforms: scenes.map(
          scene => getComputedStyle(scene).transform
        ),
        textPosition: getComputedStyle(textSurface).position
      }
    })

    expect(state.textPosition).toBe('relative')
    expect(state.answerPosition).toBe('relative')
    expect(state.resolutionPosition).toBe('relative')
    expect(state.coverDisplays).toEqual([
      'none',
      'none',
      'none',
      'none'
    ])
    expect(
      state.scenePositions.every(
        position =>
          position === 'static' || position === 'relative'
      )
    ).toBe(true)
    expect(state.sceneTransforms).toEqual([
      'none',
      'none',
      'none'
    ])
  }
})
