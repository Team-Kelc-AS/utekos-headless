import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import test from 'node:test'
import { hashCustomerMatchIdentifier } from '@/lib/google/data-manager/hashCustomerMatchIdentifier'
import { decryptFacebookLoginValue } from './facebookLoginCrypto'
import { protectFacebookLoginContact } from './protectFacebookLoginContact'

test('normalizes, hashes and encrypts fallback email without retaining plaintext', () => {
  const key = randomBytes(32)
  const protectedContact = protectFacebookLoginContact(
    ' First.Last+offer@Gmail.com ',
    key
  )

  assert.equal(protectedContact.kind, 'email')
  assert.equal(
    protectedContact.sha256,
    hashCustomerMatchIdentifier('firstlast@gmail.com')
  )
  assert.equal(
    decryptFacebookLoginValue(
      protectedContact.ciphertext,
      'email',
      key
    ),
    'firstlast@gmail.com'
  )
  assert.equal(
    protectedContact.ciphertext.includes('firstlast'),
    false
  )
})

test('normalizes, hashes and encrypts Norwegian fallback phone', () => {
  const key = randomBytes(32)
  const protectedContact = protectFacebookLoginContact(
    '912 34 567',
    key
  )

  assert.equal(protectedContact.kind, 'phone')
  assert.equal(
    protectedContact.sha256,
    hashCustomerMatchIdentifier('+4791234567')
  )
  assert.equal(
    decryptFacebookLoginValue(
      protectedContact.ciphertext,
      'phone',
      key
    ),
    '+4791234567'
  )
})

test('rejects malformed fallback contact', () => {
  const key = randomBytes(32)

  assert.throws(
    () => protectFacebookLoginContact('not-an-email@', key),
    /facebook_login_contact_invalid/
  )
  assert.throws(
    () => protectFacebookLoginContact('123', key),
    /facebook_login_contact_invalid/
  )
})
