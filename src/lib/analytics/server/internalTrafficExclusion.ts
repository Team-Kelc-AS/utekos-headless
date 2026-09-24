/**
 * Internal-traffic exclusion for ads-provider dispatch.
 *
 * Office/staff traffic (work IPs, localhost, preview deploys) must never
 * reach Meta (or other ads providers): it pollutes match quality, EMQ and
 * optimization with test events. This module decides *whether* an event is
 * internal; the planner decides which providers it applies to.
 *
 * IPs are configured via the INTERNAL_TRAFFIC_IPS env var (comma-separated
 * IPv4 addresses and/or CIDR ranges, e.g. "84.48.12.34, 158.36.0.0/16").
 * Values live in hosting env only — never commit office IPs to the repo.
 */
export const INTERNAL_TRAFFIC_IPS_ENV_KEY = 'INTERNAL_TRAFFIC_IPS'

const LOOPBACK_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '::1'
])

type InternalTrafficEvent = {
  environment?: string | undefined
  client_ip_address?: string | null | undefined
  page_url?: string | null | undefined
}

function parseIpv4Octets(value: string): number[] | undefined {
  const parts = value.split('.')
  if (parts.length !== 4) return undefined
  const octets: number[] = []
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return undefined
    const octet = Number(part)
    if (octet > 255) return undefined
    octets.push(octet)
  }
  return octets
}

function ipv4ToInt(octets: number[]): number {
  return (
    octets[0]! * 256 ** 3 +
    octets[1]! * 256 ** 2 +
    octets[2]! * 256 +
    octets[3]!
  )
}

function entryMatchesIp(entry: string, ip: string): boolean {
  if (entry === ip) return true
  const slashIndex = entry.indexOf('/')
  if (slashIndex === -1) return false
  const base = parseIpv4Octets(entry.slice(0, slashIndex))
  const bits = Number(entry.slice(slashIndex + 1))
  const candidate = parseIpv4Octets(ip)
  if (
    !base ||
    !candidate ||
    !Number.isInteger(bits) ||
    bits < 0 ||
    bits > 32
  ) {
    return false
  }
  if (bits === 0) return true
  const mask = (0xffffffff << (32 - bits)) >>> 0
  return (
    (ipv4ToInt(base) & mask) === (ipv4ToInt(candidate) & mask)
  )
}

export function readInternalTrafficIpAllowlist(
  env: Record<string, string | undefined> = process.env
): string[] {
  const raw = env[INTERNAL_TRAFFIC_IPS_ENV_KEY]
  if (!raw) return []
  return raw
    .split(',')
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0)
}

function pageUrlIsLocal(pageUrl: string): boolean {
  let hostname: string
  try {
    hostname = new URL(pageUrl).hostname.toLowerCase()
  } catch {
    return false
  }
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1)
  }
  if (LOOPBACK_HOSTNAMES.has(hostname)) return true
  return (
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.test') ||
    hostname.endsWith('.invalid')
  )
}

export function isInternalTrafficEvent(
  event: InternalTrafficEvent,
  env: Record<string, string | undefined> = process.env
): boolean {
  // NOTE: 'test' is deliberately not internal. It is the neutral default
  // in unit-test fixtures and never occurs in production runtime
  // (NODE_ENV is 'production' there), so gating on it would only break
  // tests without filtering any real traffic.
  if (
    event.environment === 'development' ||
    event.environment === 'preview'
  ) {
    return true
  }
  if (event.page_url && pageUrlIsLocal(event.page_url)) {
    return true
  }
  const allowlist = readInternalTrafficIpAllowlist(env)
  if (
    allowlist.length > 0 &&
    typeof event.client_ip_address === 'string' &&
    event.client_ip_address.length > 0
  ) {
    return allowlist.some(entry =>
      entryMatchesIp(entry, event.client_ip_address as string)
    )
  }
  return false
}
