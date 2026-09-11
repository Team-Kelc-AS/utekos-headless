export const metaInsightsAccountId = '772268237116474'
export const metaInsightsPixelId = '1092362672918571'

export const metaInsightsLiveWatch = {
  accountId: metaInsightsAccountId,
  pixelId: metaInsightsPixelId,
  adSets: [
    {
      key: 'atc',
      adSetId: '120247594128070788',
      campaignId: '120247594128080788'
    },
    {
      key: 'purchase',
      adSetId: '120247581960540788',
      campaignId: '120247581960560788'
    },
    {
      key: 'third',
      adSetId: '120247595649200788',
      campaignId: '120247595649170788'
    },
    {
      key: 'copy',
      adSetId: '120247585821380788',
      campaignId: '120247585821390788'
    }
  ]
} as const

export type MetaInsightsLiveAdSetKey =
  (typeof metaInsightsLiveWatch.adSets)[number]['key']

export type MetaInsightsLiveWatch = {
  accountId: string
  pixelId: string
  adSets: ReadonlyArray<{
    key: string
    adSetId: string
    campaignId: string
  }>
}
