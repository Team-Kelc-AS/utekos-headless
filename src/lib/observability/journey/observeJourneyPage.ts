import {
  journeyEventSchema,
  journeySectionSchema,
  sanitizeJourneyPath
} from './contract'
import type { JourneyEvent, JourneySection } from './contract'
import type { JourneyPage } from './createJourneySession'

type Observation =
  JourneyEvent extends infer E ?
    E extends JourneyEvent ?
      Pick<E, 'event_name' | 'data'>
    : never
  : never

export function observeJourneyPage(input: {
  page: JourneyPage
  environment: JourneyEvent['environment']
  navigationType?: 'back_forward'
  send: (event: JourneyEvent) => void
  allowed: () => boolean
}) {
  const { page } = input
  let stopped = false
  const timers = new Map<
    Element,
    ReturnType<typeof setTimeout>
  >()
  const observed = new Set<Element>()

  function emit(observation: Observation) {
    if (stopped || !input.allowed()) return
    const event = journeyEventSchema.safeParse({
      schema_version: 1,
      event_id: crypto.randomUUID(),
      journey_id: page.journeyId,
      page_view_id: page.pageViewId,
      ...(page.previousPageViewId ?
        { previous_page_view_id: page.previousPageViewId }
      : {}),
      occurred_at: new Date().toISOString(),
      page_path: page.pagePath,
      consent: page.consent,
      source: 'browser',
      environment: input.environment,
      ...observation
    })
    if (event.success) input.send(event.data)
  }

  function sample() {
    if (
      !input.allowed() ||
      document.visibilityState !== 'visible'
    )
      return
    const height = Math.max(
      1,
      document.documentElement.scrollHeight,
      document.body?.scrollHeight ?? 0
    )
    const viewport = Math.max(1, Math.round(window.innerHeight))
    const y = Math.max(0, Math.round(window.scrollY))
    page.documentHeight = height
    page.viewportHeight = viewport
    page.maxScrollY = Math.max(page.maxScrollY, y)
    page.maxScrollPercent = Math.max(
      page.maxScrollPercent,
      Math.min(100, Math.round(((y + viewport) / height) * 100))
    )
  }

  function progress(
    reason: Extract<
      JourneyEvent,
      { event_name: 'journey_progress' }
    >['data']['reason']
  ) {
    const signature = [
      page.maxScrollY,
      page.maxScrollPercent,
      page.documentHeight,
      page.viewportHeight,
      page.lastVisibleSection
    ].join(':')
    const now = Date.now()
    if (
      signature === page.progressSignature ||
      (reason === 'interval' && now - page.lastProgressAt < 5000)
    )
      return
    emit({
      event_name: 'journey_progress',
      data: {
        max_scroll_y: page.maxScrollY,
        max_scroll_percent: page.maxScrollPercent,
        document_height: page.documentHeight,
        viewport_height: page.viewportHeight,
        ...(page.lastVisibleSection ?
          { last_visible_section: page.lastVisibleSection }
        : {}),
        reason
      }
    })
    page.progressSignature = signature
    page.lastProgressAt = now
  }

  function clearDwell() {
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
  }

  const observer =
    typeof IntersectionObserver === 'undefined' ? undefined : (
      new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            const timer = timers.get(entry.target)
            if (timer) clearTimeout(timer)
            timers.delete(entry.target)
            if (
              !entry.isIntersecting ||
              entry.intersectionRect.height <= 0 ||
              entry.intersectionRect.width <= 0 ||
              document.visibilityState !== 'visible'
            )
              continue
            const parsed = journeySectionSchema.safeParse(
              entry.target.getAttribute('data-journey-section')
            )
            if (!parsed.success) continue
            const section: JourneySection = parsed.data
            timers.set(
              entry.target,
              setTimeout(() => {
                timers.delete(entry.target)
                if (
                  document.visibilityState !== 'visible' ||
                  !input.allowed()
                )
                  return
                const rect = entry.target.getBoundingClientRect()
                if (
                  rect.bottom <= 0 ||
                  rect.top >= window.innerHeight ||
                  rect.width <= 0 ||
                  rect.height <= 0
                )
                  return
                page.lastVisibleSection = section
                if (page.sections.has(section)) return
                page.sections.add(section)
                emit({
                  event_name: 'section_view',
                  data: { section_id: section, dwell_ms: 1000 }
                })
              }, 1000)
            )
          }
        },
        { threshold: 0 }
      )
    )

  function discoverSections() {
    if (!observer) return
    for (const node of document.querySelectorAll(
      '[data-journey-section]'
    )) {
      if (observed.has(node)) continue
      observed.add(node)
      observer.observe(node)
    }
    for (const node of observed) {
      if (node.isConnected) continue
      observer.unobserve(node)
      observed.delete(node)
      const timer = timers.get(node)
      if (timer) clearTimeout(timer)
      timers.delete(node)
    }
  }

  function click(event: MouseEvent) {
    if (
      !input.allowed() ||
      document.visibilityState !== 'visible' ||
      !(event.target instanceof Element)
    )
      return
    const link = event.target.closest('a[href]')
    if (
      !(link instanceof HTMLAnchorElement) ||
      link.hasAttribute('download')
    )
      return
    const target = new URL(link.href, window.location.href)
    if (
      !['http:', 'https:'].includes(target.protocol) ||
      target.origin !== window.location.origin
    )
      return
    const targetPath = sanitizeJourneyPath(target.pathname)
    if (!targetPath) return
    const section = journeySectionSchema.safeParse(
      link
        .closest('[data-journey-section]')
        ?.getAttribute('data-journey-section')
    )
    const fragment =
      /^#[a-z0-9_-]{1,64}$/iu.test(target.hash) ?
        target.hash
      : ''
    const stableInput = `${section.success ? section.data : 'page'}:${targetPath}${fragment}`
    let hash = 2166136261
    for (const character of stableInput)
      hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
    const explicitId = link.getAttribute('data-journey-link')
    const linkId =
      explicitId && /^[a-z0-9_-]{1,96}$/iu.test(explicitId) ?
        explicitId
      : `internal-${(hash >>> 0).toString(16)}`
    emit({
      event_name: 'internal_link_click',
      data: {
        link_id: linkId,
        ...(section.success ?
          { source_section: section.data }
        : {}),
        target_path: targetPath,
        navigation_type:
          (
            link.target === '_blank' ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey
          ) ?
            'new_tab'
          : (
            target.pathname === window.location.pathname &&
            target.search === window.location.search
          ) ?
            'same_page'
          : 'same_tab'
      }
    })
  }

  function visibility() {
    if (document.visibilityState === 'hidden') {
      clearDwell()
      progress('hidden')
    } else {
      sample()
      for (const node of observed) {
        observer?.unobserve(node)
        observer?.observe(node)
      }
    }
  }
  function pagehide() {
    clearDwell()
    progress('pagehide')
  }

  if (!page.arrived) {
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming | undefined
    emit({
      event_name: 'page_arrival',
      data: {
        navigation_type:
          input.navigationType ??
          (page.previousPageViewId ? 'internal'
          : navigation?.type === 'back_forward' ? 'back_forward'
          : 'initial')
      }
    })
    page.arrived = true
  }
  if (page.utm && !page.landingRecorded) {
    emit({ event_name: 'utm_landing_page_view', data: page.utm })
    page.landingRecorded = true
  }
  sample()
  discoverSections()
  const mutations = new MutationObserver(discoverSections)
  mutations.observe(document.documentElement, {
    childList: true,
    subtree: true
  })
  const interval = setInterval(() => {
    if (document.visibilityState !== 'visible') return
    sample()
    progress('interval')
  }, 5000)
  window.addEventListener('scroll', sample, { passive: true })
  window.addEventListener('resize', sample, { passive: true })
  window.addEventListener('pagehide', pagehide)
  document.addEventListener('visibilitychange', visibility)
  document.addEventListener('click', click, true)

  return function stop(reason: 'navigation' | 'consent') {
    if (reason === 'navigation') progress('navigation')
    stopped = true
    clearInterval(interval)
    clearDwell()
    observer?.disconnect()
    mutations.disconnect()
    window.removeEventListener('scroll', sample)
    window.removeEventListener('resize', sample)
    window.removeEventListener('pagehide', pagehide)
    document.removeEventListener('visibilitychange', visibility)
    document.removeEventListener('click', click, true)
  }
}
