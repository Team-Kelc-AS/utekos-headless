import { createHash } from 'node:crypto'

const FLIGHT_ROW_RE = /^[0-9a-f]+:/i
const NEXT_F_PUSH_RE = /self\.__next_f\.push/g
const SENSITIVE_HEADER_RE =
  /^(authorization|cookie|set-cookie|x-vercel-oidc-token|proxy-authorization)$/i
const SECRETISH_VALUE_RE =
  /(?:Bearer\s+[A-Za-z0-9._~+/=-]{12,}|sk_[A-Za-z0-9]{12,}|phc_[A-Za-z0-9]{12,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,})/g

/**
 * @param {string} value
 */
export function normalizeBaseUrl(value) {
  return value.trim().replace(/\/$/, '')
}

/**
 * @param {Headers | Record<string, string | null | undefined>} headers
 * @param {string[]} names
 */
export function pickHeaders(headers, names) {
  /** @type {Record<string, string | null>} */
  const out = {}
  const get =
    typeof headers.get === 'function' ?
      name => headers.get(name)
    : name => {
        const record =
          /** @type {Record<string, string | null | undefined>} */ (
            headers
          )
        return (
          record[name] ??
          record[name.toLowerCase()] ??
          record[name.toUpperCase()] ??
          null
        )
      }

  for (const name of names) {
    const value = get(name)
    out[name.toLowerCase()] =
      value == null || value === '' ? null : String(value)
  }
  return out
}

/**
 * @param {Record<string, string | null | undefined> | Headers} headers
 */
export function redactHeaders(headers) {
  /** @type {Record<string, string | null>} */
  const out = {}
  const entries =
    typeof headers.entries === 'function' ?
      [...headers.entries()]
    : Object.entries(
        /** @type {Record<string, string | null | undefined>} */ (
          headers
        )
      )

  for (const [name, value] of entries) {
    if (SENSITIVE_HEADER_RE.test(name)) {
      out[name.toLowerCase()] = value ? '[redacted]' : null
      continue
    }
    if (value == null || value === '') {
      out[name.toLowerCase()] = null
      continue
    }
    out[name.toLowerCase()] = String(value).replace(
      SECRETISH_VALUE_RE,
      '[redacted]'
    )
  }
  return out
}

/**
 * @param {string | Buffer | Uint8Array} body
 */
export function hashBody(body) {
  return createHash('sha256').update(body).digest('hex')
}

/**
 * Explicit HTML shell completeness checks for PPR documents.
 * @param {string} body
 */
export function analyzeHtmlCompleteness(body) {
  const lower = body.toLowerCase()
  const nextFPushes = (body.match(NEXT_F_PUSH_RE) ?? []).length
  const hasDoctype = lower.includes('<!doctype html')
  const hasHtmlOpen = /<html[\s>]/i.test(body)
  const hasHtmlClose = lower.includes('</html>')
  const hasBodyClose = lower.includes('</body>')
  const endsWithHtmlClose = /<\/html>\s*$/i.test(body.trim())
  const looksTruncatedMarker = /--\s*--\s*$/.test(body.trim())
  const reasons = []

  if (!hasDoctype && !hasHtmlOpen)
    reasons.push('missing_html_document_start')
  if (!hasHtmlClose) reasons.push('missing_html_close')
  if (!hasBodyClose) reasons.push('missing_body_close')
  if (!endsWithHtmlClose)
    reasons.push('does_not_end_with_html_close')
  if (nextFPushes === 0)
    reasons.push('missing_next_f_flight_bootstrap')
  if (looksTruncatedMarker)
    reasons.push('truncated_stream_marker')
  if (body.length === 0) reasons.push('empty_body')

  return {
    kind: 'html',
    complete: reasons.length === 0,
    reasons,
    metrics: {
      bytes: Buffer.byteLength(body),
      nextFPushes,
      hasDoctype,
      hasHtmlOpen,
      hasHtmlClose,
      hasBodyClose,
      endsWithHtmlClose
    }
  }
}

/**
 * Explicit RSC/Flight payload completeness checks.
 * @param {string} body
 * @param {{ contentType?: string | null }} [options]
 */
export function analyzeFlightCompleteness(body, options = {}) {
  const contentType = options.contentType ?? ''
  const reasons = []
  const lines = body.length === 0 ? [] : body.split(/\r?\n/)
  const nonEmptyLines = lines.filter(line => line.length > 0)
  const flightRows = nonEmptyLines.filter(line =>
    FLIGHT_ROW_RE.test(line)
  )
  const endsWithNewline = body.length > 0 && /\r?\n$/.test(body)
  const lastLine = nonEmptyLines.at(-1) ?? ''
  const lastLineIsFlightRow = FLIGHT_ROW_RE.test(lastLine)
  const contentTypeOk =
    /text\/x-component|text\/plain|application\/text/i.test(
      contentType
    )

  if (body.length === 0) reasons.push('empty_body')
  if (contentType && !contentTypeOk)
    reasons.push('unexpected_content_type')
  if (flightRows.length === 0)
    reasons.push('missing_flight_rows')
  if (!endsWithNewline) reasons.push('missing_trailing_newline')
  if (nonEmptyLines.length > 0 && !lastLineIsFlightRow) {
    reasons.push('last_line_not_flight_row')
  }
  if (/<\/html>/i.test(body) && flightRows.length === 0) {
    reasons.push('html_returned_instead_of_flight')
  }

  return {
    kind: 'flight',
    complete: reasons.length === 0,
    reasons,
    metrics: {
      bytes: Buffer.byteLength(body),
      lineCount: lines.length,
      nonEmptyLineCount: nonEmptyLines.length,
      flightRowCount: flightRows.length,
      endsWithNewline,
      lastLineIsFlightRow,
      contentType: contentType || null
    }
  }
}

/**
 * @param {'html' | 'flight'} kind
 * @param {string} body
 * @param {{ contentType?: string | null }} [options]
 */
export function analyzeCompleteness(kind, body, options = {}) {
  if (kind === 'html') return analyzeHtmlCompleteness(body)
  if (kind === 'flight')
    return analyzeFlightCompleteness(body, options)
  return {
    kind,
    complete: false,
    reasons: ['unknown_kind'],
    metrics: { bytes: Buffer.byteLength(body) }
  }
}

/**
 * Build a diagnostics-safe artifact entry (no full bodies, no secrets).
 * @param {object} input
 */
export function toSafeArtifact(input) {
  const body = typeof input.body === 'string' ? input.body : ''
  return {
    route: input.route,
    kind: input.kind,
    attempt: input.attempt ?? null,
    observation: input.observation ?? null,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    durationMs: input.durationMs,
    status: input.status,
    ok: input.ok,
    headers: redactHeaders(input.headers ?? {}),
    completeness: input.completeness,
    bodySha256: hashBody(body),
    bodyBytes: Buffer.byteLength(body),
    error: input.error ?? null
  }
}
