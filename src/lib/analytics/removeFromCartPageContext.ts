import {
  browserPageViewSession,
  type PageViewContext
} from './pageViewSession'

export type RemoveFromCartPageContext = PageViewContext & {
  readonly pageTitle: string
}

type Dependencies = {
  readPage: () => {
    pageUrl: string
    pageTitle: string
    documentReferrer: string
  }
  session: Pick<typeof browserPageViewSession, 'ensure'>
}

const defaultDependencies: Dependencies = {
  readPage: () => ({
    pageUrl: window.location.href,
    pageTitle: document.title,
    documentReferrer: document.referrer
  }),
  session: browserPageViewSession
}

/** Capture before the mutation/debounce; never let telemetry block the cart. */
export function captureRemoveFromCartPageContext(
  dependencies: Dependencies = defaultDependencies
): RemoveFromCartPageContext | undefined {
  try {
    const page = dependencies.readPage()
    if (!page.pageTitle.trim()) return undefined
    return Object.freeze({
      ...dependencies.session.ensure(page),
      pageTitle: page.pageTitle
    })
  } catch {
    return undefined
  }
}
