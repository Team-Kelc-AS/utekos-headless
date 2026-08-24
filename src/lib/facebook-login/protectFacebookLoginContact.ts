import 'server-only'

import { z } from 'zod'
import { normalizeCustomerMatchEmail } from '@/lib/google/data-manager/normalizeCustomerMatchEmail'
import { normalizeCustomerMatchPhone } from '@/lib/google/data-manager/normalizeCustomerMatchPhone'
import { hashCustomerMatchIdentifier } from '@/lib/google/data-manager/hashCustomerMatchIdentifier'
import { encryptFacebookLoginValue } from './facebookLoginCrypto'

const fallbackEmailSchema = z.string().email().max(320)

export type ProtectedFacebookLoginContact =
  | { kind: 'email'; ciphertext: string; sha256: string }
  | { kind: 'phone'; ciphertext: string; sha256: string }

export function protectFacebookLoginContact(
  contact: string,
  identityKey: Buffer
): ProtectedFacebookLoginContact {
  const trimmed = contact.trim()

  if (trimmed.includes('@')) {
    const parsedEmail = fallbackEmailSchema.safeParse(trimmed)
    if (!parsedEmail.success) {
      throw new Error('facebook_login_contact_invalid')
    }

    const normalized = normalizeCustomerMatchEmail(
      parsedEmail.data
    )
    if (!normalized) {
      throw new Error('facebook_login_contact_invalid')
    }

    return {
      kind: 'email',
      ciphertext: encryptFacebookLoginValue(
        normalized,
        'email',
        identityKey
      ),
      sha256: hashCustomerMatchIdentifier(normalized)
    }
  }

  const normalized = normalizeCustomerMatchPhone(trimmed)
  if (!normalized) {
    throw new Error('facebook_login_contact_invalid')
  }

  return {
    kind: 'phone',
    ciphertext: encryptFacebookLoginValue(
      normalized,
      'phone',
      identityKey
    ),
    sha256: hashCustomerMatchIdentifier(normalized)
  }
}
