import 'server-only'

import { getPostgresClient } from '@/lib/db/getPostgresClient'
import type { CampaignAttribution } from '@/lib/analytics/campaignAttribution'

type UpsertFacebookLoginIdentityInput = {
  appId: string
  attribution?: CampaignAttribution
  emailCiphertext?: string
  emailPermissionGranted: boolean
  emailSha256?: string
  externalId: string
  facebookLoginId: string
  fbc?: string
  fbclid?: string
}

type UpdateFacebookLoginContactInput = {
  appId: string
  emailCiphertext?: string
  emailSha256?: string
  identityId: string
  phoneCiphertext?: string
  phoneSha256?: string
}

function getSql() {
  const sql = getPostgresClient()
  if (!sql) {
    throw new Error('facebook_login_database_unavailable')
  }
  return sql
}

export async function upsertFacebookLoginIdentity(
  input: UpsertFacebookLoginIdentityInput
): Promise<{ id: string }> {
  const sql = getSql()
  const rows = await sql`
    insert into marketing.facebook_login_identities (
      app_id,
      facebook_login_id,
      external_id,
      email_ciphertext,
      email_sha256,
      email_permission_granted,
      fbclid,
      fbc,
      campaign_id,
      campaign_name,
      adset_id,
      adset_name,
      ad_id,
      ad_name
    ) values (
      ${input.appId},
      ${input.facebookLoginId},
      ${input.externalId},
      ${input.emailCiphertext ?? null},
      ${input.emailSha256 ?? null},
      ${input.emailPermissionGranted},
      ${input.fbclid ?? null},
      ${input.fbc ?? null},
      ${input.attribution?.campaign_id ?? null},
      ${input.attribution?.campaign_name ?? null},
      ${input.attribution?.adset_id ?? null},
      ${input.attribution?.adset_name ?? null},
      ${input.attribution?.ad_id ?? null},
      ${input.attribution?.ad_name ?? null}
    )
    on conflict (app_id, facebook_login_id) do update
    set
      external_id = excluded.external_id,
      email_ciphertext = coalesce(
        excluded.email_ciphertext,
        marketing.facebook_login_identities.email_ciphertext
      ),
      email_sha256 = coalesce(
        excluded.email_sha256,
        marketing.facebook_login_identities.email_sha256
      ),
      email_permission_granted =
        marketing.facebook_login_identities.email_permission_granted
        or excluded.email_permission_granted,
      fbclid = coalesce(
        excluded.fbclid,
        marketing.facebook_login_identities.fbclid
      ),
      fbc = coalesce(
        excluded.fbc,
        marketing.facebook_login_identities.fbc
      ),
      campaign_id = coalesce(
        excluded.campaign_id,
        marketing.facebook_login_identities.campaign_id
      ),
      campaign_name = coalesce(
        excluded.campaign_name,
        marketing.facebook_login_identities.campaign_name
      ),
      adset_id = coalesce(
        excluded.adset_id,
        marketing.facebook_login_identities.adset_id
      ),
      adset_name = coalesce(
        excluded.adset_name,
        marketing.facebook_login_identities.adset_name
      ),
      ad_id = coalesce(
        excluded.ad_id,
        marketing.facebook_login_identities.ad_id
      ),
      ad_name = coalesce(
        excluded.ad_name,
        marketing.facebook_login_identities.ad_name
      ),
      login_count =
        marketing.facebook_login_identities.login_count + 1,
      last_login_at = statement_timestamp(),
      updated_at = statement_timestamp(),
      expires_at = statement_timestamp() + interval '180 days'
    returning id
  `

  const id = rows[0]?.id
  if (typeof id !== 'string') {
    throw new Error('facebook_login_identity_upsert_failed')
  }

  return { id }
}

export async function updateFacebookLoginContact(
  input: UpdateFacebookLoginContactInput
) {
  const sql = getSql()
  const rows = await sql`
    update marketing.facebook_login_identities
    set
      email_ciphertext = coalesce(
        ${input.emailCiphertext ?? null},
        email_ciphertext
      ),
      email_sha256 = coalesce(
        ${input.emailSha256 ?? null},
        email_sha256
      ),
      phone_ciphertext = coalesce(
        ${input.phoneCiphertext ?? null},
        phone_ciphertext
      ),
      phone_sha256 = coalesce(
        ${input.phoneSha256 ?? null},
        phone_sha256
      ),
      contact_updated_at = statement_timestamp(),
      updated_at = statement_timestamp(),
      expires_at = statement_timestamp() + interval '180 days'
    where id = ${input.identityId}::uuid
      and app_id = ${input.appId}
    returning id
  `

  if (rows.length !== 1) {
    throw new Error('facebook_login_identity_not_found')
  }
}
