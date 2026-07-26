import type { CanonicalCommerceItem } from './canonicalCommerceItem'
import { browserPageViewSession } from './pageViewSession'
import { reportCanonicalViewItemList } from './viewItemListReporter'
import { mapShopifyViewItem } from './shopifyViewItemCommerce'
import type { ShopifyProduct } from 'types/product/ShopifyProduct'
import type { ShopifyProductVariant } from 'types/product/ShopifyProductVariant'

export const PRODUCT_LIST_VISIBILITY_RATIO = 0.5
export const PRODUCT_LIST_VISIBILITY_DURATION_MS = 1_000
export const PRODUCT_LIST_FLUSH_DELAY_MS = 50
export const PRODUCT_LIST_MAX_ITEMS_PER_EVENT = 20

export type ProductListVisibilityRegistration = {
  element: Element
  itemListId: string
  itemListName: string
  product: ShopifyProduct
  totalItemCount: number
  variant: ShopifyProductVariant
}

type QualifiedProduct = Omit<
  ProductListVisibilityRegistration,
  'element'
> & {
  item: CanonicalCommerceItem
  currency: string
  grossValue: number
  taxValue: number
  value: number
}

type TimerHandle = ReturnType<typeof setTimeout>

type ListState = {
  flushTimer: TimerHandle | undefined
  impressionSequence: number
  itemListId: string
  itemListName: string
  pageViewId: string
  pending: Map<string, QualifiedProduct>
  seenVariantIds: Set<string>
}

type ObservedRegistration = {
  input: ProductListVisibilityRegistration
  qualifyingTimer: TimerHandle | undefined
  visible: boolean
}

export type ProductListVisibilityEntry = {
  intersectionRatio: number
  isIntersecting: boolean
  target: Element
}

export type ProductListVisibilityObserver = {
  observe: (element: Element) => void
  unobserve: (element: Element) => void
}

type ProductListVisibilityTrackerDependencies = {
  clearTimer: (handle: TimerHandle) => void
  createObserver: (
    onEntries: (entries: readonly ProductListVisibilityEntry[]) => void,
    threshold: number
  ) => ProductListVisibilityObserver | undefined
  getPageViewId: () => string
  report: typeof reportCanonicalViewItemList
  setTimer: (
    callback: () => void,
    delayMs: number
  ) => TimerHandle
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }

  return result
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function createCanonicalProductListVisibilityTracker(
  dependencies: ProductListVisibilityTrackerDependencies
) {
  const lists = new Map<string, ListState>()
  const registrations = new Map<Element, ObservedRegistration>()
  let currentPageViewId: string | undefined
  let observer: ProductListVisibilityObserver | undefined

  function clearListStates() {
    for (const state of lists.values()) {
      if (state.flushTimer) {
        dependencies.clearTimer(state.flushTimer)
      }
    }
    lists.clear()
  }

  function getCurrentPageViewId() {
    const pageViewId = dependencies.getPageViewId()

    if (currentPageViewId !== pageViewId) {
      clearListStates()
      currentPageViewId = pageViewId
    }

    return pageViewId
  }

  function getListState(
    input: ProductListVisibilityRegistration
  ) {
    const pageViewId = getCurrentPageViewId()
    const key = `${pageViewId}:${input.itemListId}`
    const existing = lists.get(key)
    if (existing) return existing

    const created: ListState = {
      flushTimer: undefined,
      impressionSequence: 0,
      itemListId: input.itemListId,
      itemListName: input.itemListName,
      pageViewId,
      pending: new Map(),
      seenVariantIds: new Set()
    }
    lists.set(key, created)
    return created
  }

  function flush(state: ListState) {
    state.flushTimer = undefined
    const qualified = [...state.pending.values()]
    state.pending.clear()

    for (const chunk of chunks(
      qualified,
      PRODUCT_LIST_MAX_ITEMS_PER_EVENT
    )) {
      if (chunk.length === 0) continue

      const currency = chunk[0]!.currency
      if (chunk.some(current => current.currency !== currency)) {
        throw new Error(
          'A product-list impression cannot mix currencies'
        )
      }

      state.impressionSequence += 1
      dependencies.report({
        pageViewId: state.pageViewId,
        customData: {
          currency,
          gross_value: roundMoney(
            chunk.reduce(
              (sum, current) => sum + current.grossValue,
              0
            )
          ),
          impression_sequence: state.impressionSequence,
          item_list_id: state.itemListId,
          item_list_name: state.itemListName,
          items: chunk.map(current => current.item),
          tax_value: roundMoney(
            chunk.reduce(
              (sum, current) => sum + current.taxValue,
              0
            )
          ),
          total_item_count: Math.max(
            ...chunk.map(current => current.totalItemCount)
          ),
          value: roundMoney(
            chunk.reduce(
              (sum, current) => sum + current.value,
              0
            )
          )
        }
      })
    }
  }

  function qualify(input: ProductListVisibilityRegistration) {
    const state = getListState(input)
    if (state.seenVariantIds.has(input.variant.id)) return

    const commerce = mapShopifyViewItem({
      product: input.product,
      variant: input.variant
    })

    state.seenVariantIds.add(input.variant.id)
    state.pending.set(input.variant.id, {
      currency: commerce.currency,
      grossValue: commerce.gross_value,
      item: commerce.items[0],
      itemListId: input.itemListId,
      itemListName: input.itemListName,
      product: input.product,
      taxValue: commerce.tax_value,
      totalItemCount: input.totalItemCount,
      value: commerce.value,
      variant: input.variant
    })

    state.flushTimer ??= dependencies.setTimer(
      () => flush(state),
      PRODUCT_LIST_FLUSH_DELAY_MS
    )
  }

  function handleVisibility(
    entries: readonly ProductListVisibilityEntry[]
  ) {
    for (const entry of entries) {
      const registration = registrations.get(entry.target)
      if (!registration) continue

      const isVisible =
        entry.isIntersecting &&
        entry.intersectionRatio >= PRODUCT_LIST_VISIBILITY_RATIO
      registration.visible = isVisible

      if (!isVisible) {
        if (registration.qualifyingTimer) {
          dependencies.clearTimer(registration.qualifyingTimer)
          registration.qualifyingTimer = undefined
        }
        continue
      }

      if (registration.qualifyingTimer) continue

      registration.qualifyingTimer = dependencies.setTimer(() => {
        registration.qualifyingTimer = undefined
        if (registration.visible) qualify(registration.input)
      }, PRODUCT_LIST_VISIBILITY_DURATION_MS)
    }
  }

  function getObserver() {
    observer ??= dependencies.createObserver(
      handleVisibility,
      PRODUCT_LIST_VISIBILITY_RATIO
    )
    return observer
  }

  function register(input: ProductListVisibilityRegistration) {
    if (
      input.totalItemCount < 1 ||
      !input.itemListId.trim() ||
      !input.itemListName.trim()
    ) {
      return () => {}
    }

    const intersectionObserver = getObserver()
    if (!intersectionObserver) return () => {}

    const registration: ObservedRegistration = {
      input,
      qualifyingTimer: undefined,
      visible: false
    }
    registrations.set(input.element, registration)
    intersectionObserver.observe(input.element)

    return () => {
      if (registration.qualifyingTimer) {
        dependencies.clearTimer(registration.qualifyingTimer)
      }
      registrations.delete(input.element)
      intersectionObserver.unobserve(input.element)
    }
  }

  return { register }
}

const browserTracker = createCanonicalProductListVisibilityTracker({
  clearTimer: handle => globalThis.clearTimeout(handle),
  createObserver: (onEntries, threshold) => {
    if (typeof IntersectionObserver === 'undefined') {
      return undefined
    }

    return new IntersectionObserver(
      entries => onEntries(entries),
      { threshold: [threshold] }
    )
  },
  getPageViewId: () =>
    browserPageViewSession.ensure({
      pageUrl: window.location.href,
      ...(document.referrer ?
        { documentReferrer: document.referrer }
      : {})
    }).pageViewId,
  report: reportCanonicalViewItemList,
  setTimer: (callback, delayMs) =>
    globalThis.setTimeout(callback, delayMs)
})

export function registerCanonicalProductListVisibility(
  input: ProductListVisibilityRegistration
) {
  return browserTracker.register(input)
}
