export const ASSISTANT_BUCKET_STORAGE_KEY =
  'utekos_assistant_bucket_v1'

export type AssistantExposure = 'assistant' | 'holdout'

export type AssistantBucketStorage = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type AssistantRolloutEnvironment = Readonly<
  Record<string, string | undefined>
>

const ASSISTANT_EXCLUDED_ROUTE_ROOTS = [
  '/design',
  '/kjop',
  '/kasse',
  '/checkout',
  '/checkouts'
] as const

const ROLLOUT_PERCENT_PATTERN = /^(?:0|[1-9]\d?|100)$/u
const PRODUCT_DETAIL_PATH_PATTERN =
  /^\/produkter\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/u

function isValidRolloutPercent(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= 100
}

function isValidBucket(value: number) {
  return Number.isFinite(value) && value >= 0 && value < 1
}

function parseStoredBucket(value: string | null) {
  if (!value || value.trim() !== value) return null

  const bucket = Number(value)
  return isValidBucket(bucket) ? bucket : null
}

export function resolveAssistantRolloutPercent(
  environment: AssistantRolloutEnvironment
) {
  const value = environment.CUSTOMER_ASSISTANT_ROLLOUT_PERCENT

  if (!value || !ROLLOUT_PERCENT_PATTERN.test(value)) return 0

  return Number(value)
}

export function resolveAssistantPreviewRolloutPercent(
  environment: AssistantRolloutEnvironment
) {
  if (environment.VERCEL_ENV !== 'preview') return 0

  const percent = resolveAssistantRolloutPercent(environment)
  return percent > 0 ? percent : 0
}

export function resolveAssistantDeploymentRolloutPercent(
  environment: AssistantRolloutEnvironment
) {
  if (
    environment.VERCEL_ENV !== 'preview' &&
    environment.VERCEL_ENV !== 'production'
  ) {
    return 0
  }

  const percent = resolveAssistantRolloutPercent(environment)
  return percent > 0 ? percent : 0
}

export function resolveAssistantExposure(
  percent: number,
  bucket: number
): AssistantExposure {
  if (
    !isValidRolloutPercent(percent) ||
    !isValidBucket(bucket)
  ) {
    return 'holdout'
  }

  return bucket < percent / 100 ? 'assistant' : 'holdout'
}

export function resolveAssistantClientExposure(
  percent: number,
  storage: AssistantBucketStorage | null,
  createBucket: () => number = Math.random
): AssistantExposure {
  if (!isValidRolloutPercent(percent) || percent === 0) {
    return 'holdout'
  }

  let bucket: number | null = null

  if (storage) {
    try {
      bucket = parseStoredBucket(
        storage.getItem(ASSISTANT_BUCKET_STORAGE_KEY)
      )
    } catch {
      bucket = null
    }
  }

  if (bucket === null) {
    const replacement = createBucket()
    if (!isValidBucket(replacement)) return 'holdout'

    bucket = replacement

    if (storage) {
      try {
        storage.setItem(
          ASSISTANT_BUCKET_STORAGE_KEY,
          String(bucket)
        )
      } catch {
        // Browser privacy settings may disable storage. The caller's
        // memory-stable bucket remains authoritative for this page load.
      }
    }
  }

  return resolveAssistantExposure(percent, bucket)
}

export function isAssistantExcludedPathname(
  pathname: string | null
) {
  if (!pathname) return false

  return ASSISTANT_EXCLUDED_ROUTE_ROOTS.some(
    route =>
      pathname === route || pathname.startsWith(`${route}/`)
  )
}

export function resolveAssistantProductHandle(
  pathname: string | null
) {
  if (!pathname) return null

  return PRODUCT_DETAIL_PATH_PATTERN.exec(pathname)?.[1] ?? null
}
