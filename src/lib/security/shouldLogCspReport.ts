import type { ParsedCspReport } from './parseCspReport'

const PRODUCTION_DOCUMENT_HOSTS = new Set(['utekos.no', 'www.utekos.no'])

export function shouldLogCspReport(report: ParsedCspReport): boolean {
  return (
    report.documentHost !== undefined &&
    PRODUCTION_DOCUMENT_HOSTS.has(report.documentHost)
  )
}
