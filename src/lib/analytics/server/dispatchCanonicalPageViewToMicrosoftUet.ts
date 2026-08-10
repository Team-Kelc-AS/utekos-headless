import type { CanonicalPageView } from '../pageViewEvent'
import {
  sendMicrosoftUetCapiPageView,
  type MicrosoftUetCapiPageViewSendDependencies,
  type MicrosoftUetCapiPageViewSendResult
} from './sendMicrosoftUetCapiPageView'

export type MicrosoftUetPageViewDispatchReceipt = {
  eventId: string
  eventName: 'page_view'
  provider: 'microsoft_uet'
  result: MicrosoftUetCapiPageViewSendResult
}

export type MicrosoftUetPageViewDispatchDependencies = {
  sendEvent: (
    event: CanonicalPageView,
    dependencies?: MicrosoftUetCapiPageViewSendDependencies
  ) => Promise<MicrosoftUetCapiPageViewSendResult>
}

const defaultDependencies: MicrosoftUetPageViewDispatchDependencies = {
  sendEvent: sendMicrosoftUetCapiPageView
}

export async function dispatchCanonicalPageViewToMicrosoftUet(
  event: CanonicalPageView,
  dependencies: MicrosoftUetPageViewDispatchDependencies =
    defaultDependencies
): Promise<MicrosoftUetPageViewDispatchReceipt> {
  const result = await dependencies.sendEvent(event)

  return {
    eventId: event.event_id,
    eventName: 'page_view',
    provider: 'microsoft_uet',
    result
  }
}
