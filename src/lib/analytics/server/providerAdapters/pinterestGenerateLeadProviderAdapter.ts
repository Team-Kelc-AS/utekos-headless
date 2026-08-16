import { canonicalGenerateLeadSchema } from '../../generateLeadEvent'
import { createPinterestProviderAdapter } from '../createPinterestProviderAdapter'

export const pinterestGenerateLeadProviderAdapter =
  createPinterestProviderAdapter({
    eventName: 'generate_lead',
    key: 'pinterest:generate_lead',
    schema: canonicalGenerateLeadSchema
  })
