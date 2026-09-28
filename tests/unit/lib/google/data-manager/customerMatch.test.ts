import assert from 'node:assert/strict'
import test from 'node:test'

import { buildCustomerMatchAudienceMember } from '@/lib/google/data-manager/buildCustomerMatchAudienceMember'
import { buildCustomerMatchIngestRequest } from '@/lib/google/data-manager/buildCustomerMatchIngestRequest'
import { CUSTOMER_MATCH_DESTINATION_REFERENCE } from '@/lib/google/data-manager/customerMatchTypes'
import { hashCustomerMatchIdentifier } from '@/lib/google/data-manager/hashCustomerMatchIdentifier'
import { normalizeCustomerMatchEmail } from '@/lib/google/data-manager/normalizeCustomerMatchEmail'
import { normalizeCustomerMatchPhone } from '@/lib/google/data-manager/normalizeCustomerMatchPhone'

test('normalizes Customer Match email addresses according to Data Manager rules', () => {
  assert.equal(
    normalizeCustomerMatchEmail(' Cloudy.SanFrancisco+shopping@Gmail.com '),
    'cloudysanfrancisco@gmail.com'
  )
  assert.equal(
    normalizeCustomerMatchEmail(' user.name+nyc@Example.com '),
    'user.name+nyc@example.com'
  )
  assert.equal(normalizeCustomerMatchEmail('not-an-email'), null)
})

test('normalizes Customer Match phone numbers to E.164 where safe', () => {
  assert.equal(normalizeCustomerMatchPhone('12345678'), '+4712345678')
  assert.equal(normalizeCustomerMatchPhone('0047 12 34 56 78'), '+4712345678')
  assert.equal(normalizeCustomerMatchPhone('+47 12 34 56 78'), '+4712345678')
  assert.equal(normalizeCustomerMatchPhone('555-0100'), null)
})

test('hashes normalized identifiers with SHA-256 hex encoding', () => {
  assert.equal(
    hashCustomerMatchIdentifier('test@example.com'),
    '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
  )
})

test('builds Customer Match audience members only from consented identifiers', () => {
  const member = buildCustomerMatchAudienceMember({
    id: 'gid://shopify/Customer/1',
    firstName: 'Test',
    lastName: 'Customer',
    email: 'Cloudy.SanFrancisco+shopping@Gmail.com',
    phone: '+47 12 34 56 78',
    emailMarketingSubscribed: true,
    smsMarketingSubscribed: false
  })

  assert.deepEqual(member, {
    destinationReferences: [CUSTOMER_MATCH_DESTINATION_REFERENCE],
    consent: {
      adUserData: 'CONSENT_GRANTED',
      adPersonalization: 'CONSENT_GRANTED'
    },
    compositeData: {
      userData: {
        userIdentifiers: [
          {
            emailAddress:
              '223ebda6f6889b1494551ba902d9d381daf2f642bae055888e96343d53e9f9c4'
          }
        ]
      }
    }
  })
})

test('builds Data Manager Customer Match ingest request with validateOnly default flow', () => {
  const request = buildCustomerMatchIngestRequest({
    config: {
      googleAdsCustomerId: '18180376403',
      googleAdsLoginCustomerId: '1234567890',
      customerMatchUserListId: '987654321',
      serviceAccount: {
        clientEmail: 'tag-manager-service-account@nifty-structure-490519-u6.iam.gserviceaccount.com',
        privateKey: 'secret'
      }
    },
    audienceMembers: [
      {
        destinationReferences: [CUSTOMER_MATCH_DESTINATION_REFERENCE],
        consent: {
          adUserData: 'CONSENT_GRANTED',
          adPersonalization: 'CONSENT_GRANTED'
        },
        compositeData: {
          userData: {
            userIdentifiers: [
              {
                phoneNumber:
                  'bfc3db8618a1128545b15c1bc774da3ff57a4bf6c18bf3258fa3a4bbcc4534a0'
              }
            ]
          }
        }
      }
    ],
    validateOnly: true
  })

  assert.equal(request.validateOnly, true)
  assert.equal(request.encoding, 'HEX')
  assert.equal(request.destinations[0]?.reference, CUSTOMER_MATCH_DESTINATION_REFERENCE)
  assert.equal(request.destinations[0]?.operatingAccount.accountType, 'GOOGLE_ADS')
  assert.equal(request.destinations[0]?.operatingAccount.accountId, '18180376403')
  assert.equal(request.destinations[0]?.productDestinationId, '987654321')
  assert.equal(
    request.termsOfService.customerMatchTermsOfServiceStatus,
    'ACCEPTED'
  )
})
