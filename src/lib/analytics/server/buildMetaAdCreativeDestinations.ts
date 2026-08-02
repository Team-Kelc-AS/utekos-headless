import { createHash } from 'node:crypto'
import type { MetaAdCreativeDestination } from './metaAdCreativeDestination'
import type {
  MetaAdCreativeAccountAd,
  MetaAdCreativeResponse
} from './metaAdCreativeDestinationSchema'

type DestinationCandidate = Pick<
  MetaAdCreativeDestination,
  | 'destinationUrl'
  | 'dynamicResolutionStatus'
  | 'sourceKind'
  | 'sourcePath'
>

function hash(value: unknown) {
  return createHash('sha256')
    .update(JSON.stringify(value))
    .digest('hex')
}

function normalizeDestinationUrl(value: string) {
  if (value.includes('{{')) return value

  const url = new URL(value)
  url.hash = ''
  return url.toString()
}

function resolutionStatus(value: string) {
  if (value.includes('{{')) return 'template' as const
  const protocol = new URL(value).protocol
  return protocol === 'http:' || protocol === 'https:' ?
      ('static' as const)
    : ('deeplink' as const)
}

function destinationCandidates(
  creative: MetaAdCreativeResponse
): DestinationCandidate[] {
  const candidates: DestinationCandidate[] = []

  for (const [index, linkUrl] of (
    creative.asset_feed_spec?.link_urls ?? []
  ).entries()) {
    if (!linkUrl.website_url) continue
    candidates.push({
      destinationUrl: linkUrl.website_url,
      dynamicResolutionStatus: resolutionStatus(
        linkUrl.website_url
      ),
      sourceKind: 'asset_feed_link_url',
      sourcePath: `asset_feed_spec.link_urls[${index}].website_url`
    })
  }

  const storyCandidates = [
    {
      kind: 'object_story_link_data' as const,
      path: 'object_story_spec.link_data.link',
      value: creative.object_story_spec?.link_data?.link
    },
    {
      kind: 'object_story_template_data' as const,
      path: 'object_story_spec.template_data.link',
      value: creative.object_story_spec?.template_data?.link
    },
    {
      kind: 'object_story_video_call_to_action' as const,
      path: 'object_story_spec.video_data.call_to_action.value.link',
      value:
        creative.object_story_spec?.video_data?.call_to_action
          ?.value?.link
    },
    {
      kind: 'object_url' as const,
      path: 'object_url',
      value: creative.object_url
    },
    {
      kind: 'template_url_spec_web' as const,
      path: 'template_url_spec.web.url',
      value: creative.template_url_spec?.web?.url
    }
  ]

  for (const candidate of storyCandidates) {
    if (!candidate.value) continue
    candidates.push({
      destinationUrl: candidate.value,
      dynamicResolutionStatus: resolutionStatus(candidate.value),
      sourceKind: candidate.kind,
      sourcePath: candidate.path
    })
  }

  if (candidates.length > 0) return candidates
  if (creative.product_set_id) {
    return [
      {
        destinationUrl: null,
        dynamicResolutionStatus: 'catalog_dynamic',
        sourceKind: 'catalog_product_set',
        sourcePath: 'product_set_id'
      }
    ]
  }

  return [
    {
      destinationUrl: null,
      dynamicResolutionStatus: 'unresolved',
      sourceKind: 'unresolved',
      sourcePath: 'creative'
    }
  ]
}

export function buildMetaAdCreativeDestinations(input: {
  accountId: string
  ad: MetaAdCreativeAccountAd
  creative: MetaAdCreativeResponse
}) {
  if (input.ad.creative.id !== input.creative.id) {
    throw new Error(
      'Meta returned an unexpected creative for the ad'
    )
  }

  const urlTags = input.creative.url_tags?.trim() || null
  const observedVersion = hash({
    ad: input.ad,
    creative: input.creative
  })

  return destinationCandidates(input.creative).map(candidate => {
    const normalizedDestinationUrl =
      candidate.destinationUrl ?
        normalizeDestinationUrl(candidate.destinationUrl)
      : null
    const destinationFingerprint = hash({
      destinationUrl: normalizedDestinationUrl,
      dynamicResolutionStatus: candidate.dynamicResolutionStatus,
      sourceKind: candidate.sourceKind,
      sourcePath: candidate.sourcePath,
      urlTags
    })

    return {
      accountId: input.accountId,
      adCreatedTime: input.ad.created_time,
      adId: input.ad.id,
      adUpdatedTime: input.ad.updated_time,
      creativeId: input.creative.id,
      destinationFingerprint,
      destinationUrl: candidate.destinationUrl,
      dynamicResolutionStatus: candidate.dynamicResolutionStatus,
      effectiveStatus: input.ad.effective_status,
      normalizedDestinationUrl,
      observedVersion,
      sourceKind: candidate.sourceKind,
      sourcePath: candidate.sourcePath,
      urlTags
    } satisfies MetaAdCreativeDestination
  })
}
