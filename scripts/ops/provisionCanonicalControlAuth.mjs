import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { parse } from 'dotenv'
import { WorkOS } from '@workos-inc/node'

// Explicit operator action only. Never run from build, dev or release hooks.
const sourcePath = process.argv[2]
if (!sourcePath || !process.argv.includes('--apply-production'))
  throw new Error(
    'Provide the existing WorkOS env file and --apply-production after operator approval'
  )
const source = parse(readFileSync(resolve(sourcePath)))
const clientId = 'client_01KM0M9W4MW8M80P7DHD3WT1A3'
const userId = 'user_01KNPY3TRKJV183C7PFS9C1J7B'
const organizationId = 'org_01KNPYFFE8P9FA0ZZKA6NF4STB'
if (source.WORKOS_PROD_CLIENT_ID !== clientId)
  throw new Error('Production WorkOS client mismatch')
const apiKey = source.WORKOS_PROD_API_KEY
if (!apiKey) throw new Error('Production WorkOS API key missing')
const workos = new WorkOS(apiKey, { clientId })
const user = await workos.userManagement.getUser(userId)
if (!user.emailVerified || user.email !== 'kristoffer@utekos.no')
  throw new Error('Operator identity verification failed')
const localPath = resolve('.env.canonical-control.local')
const existing =
  existsSync(localPath) ? parse(readFileSync(localPath)) : {}
const values = {
  WORKOS_API_KEY: apiKey,
  WORKOS_CLIENT_ID: clientId,
  WORKOS_COOKIE_PASSWORD:
    existing.WORKOS_COOKIE_PASSWORD ??
    randomBytes(32).toString('base64url'),
  WORKOS_COOKIE_NAME: '__Host-canonical-control',
  WORKOS_COOKIE_MAX_AGE: '3600',
  WORKOS_ORGANIZATION_ID: organizationId,
  CANONICAL_CONTROL_USER_ID: userId,
  NEXT_PUBLIC_WORKOS_REDIRECT_URI:
    'https://utekos.no/canonical-control/callback'
}
execFileSync(
  'git',
  ['check-ignore', '.env.canonical-control.local'],
  { stdio: 'ignore' }
)
writeFileSync(
  localPath,
  Object.entries(values)
    .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
    .join('\n') + '\n',
  { mode: 0o600 }
)
const listing = execFileSync(
  'vercel',
  ['env', 'ls', 'production', '--no-color'],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
)
const remoteNames = new Set(
  listing.split('\n').map(line => line.trim().split(/\s+/)[0])
)
for (const [name, value] of Object.entries(values)) {
  if (remoteNames.has(name)) {
    console.log(`${name}: already exists; not overwritten`)
    continue
  }
  try {
    execFileSync(
      'vercel',
      [
        'env',
        'add',
        name,
        'production',
        '--sensitive',
        '--no-color'
      ],
      {
        input: value,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }
    )
    console.log(`${name}: configured as sensitive in Production`)
  } catch {
    throw new Error(
      `Configuration failed for ${name}; previously added values retained, no secrets logged`
    )
  }
}
console.log(
  'Operator identity verified. Local config retained with mode 0600. New deployment required.'
)
