import { z } from 'zod/v4'

const cspReportSchema = z.object({
  'csp-report': z.object({
    'effective-directive': z.string().max(128).optional(),
    'violated-directive': z.string().max(256).optional(),
    'blocked-uri': z.string().max(4096).optional(),
    'document-uri': z.string().max(4096).optional(),
    disposition: z.string().max(32).optional()
  }).passthrough()
}).passthrough()

const ALLOWED_DIRECTIVES = new Set([
  'base-uri',
  'child-src',
  'connect-src',
  'default-src',
  'font-src',
  'form-action',
  'frame-ancestors',
  'frame-src',
  'img-src',
  'manifest-src',
  'media-src',
  'object-src',
  'script-src',
  'script-src-attr',
  'script-src-elem',
  'style-src',
  'style-src-attr',
  'style-src-elem',
  'worker-src'
])

function directive(value: string | undefined): string {
  const token = value?.trim().toLowerCase()
  return token && ALLOWED_DIRECTIVES.has(token) ? token : 'unknown'
}

function hostname(value: string | undefined): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.hostname.toLowerCase() : 'non-http-scheme'
  } catch {
    return 'invalid-uri'
  }
}

export type ParsedCspReport = {
  directive: string
  blockedHost: string | undefined
  documentHost: string | undefined
  disposition: 'enforce' | 'report'
}

export function parseCspReport(value: unknown): ParsedCspReport {
  const report = cspReportSchema.parse(value)['csp-report']
  return {
    directive: directive(report['effective-directive'] || report['violated-directive']),
    blockedHost: hostname(report['blocked-uri']),
    documentHost: hostname(report['document-uri']),
    disposition: report.disposition === 'enforce' ? 'enforce' : 'report'
  }
}
