import { canonicalPageViewSchema } from '../../pageViewEvent'
import { createMicrosoftUetProviderAdapter } from '../createMicrosoftUetProviderAdapter'
import { dispatchCanonicalPageViewToMicrosoftUet } from '../dispatchCanonicalPageViewToMicrosoftUet'

export const microsoftUetPageViewProviderAdapter =
  createMicrosoftUetProviderAdapter({
    dispatch: dispatchCanonicalPageViewToMicrosoftUet,
    eventName: 'page_view',
    key: 'microsoft_uet:page_view',
    schema: canonicalPageViewSchema
  })
