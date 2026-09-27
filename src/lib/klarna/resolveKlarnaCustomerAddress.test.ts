import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveKlarnaCustomerAddress } from '@/lib/klarna/resolveKlarnaCustomerAddress'

describe('resolveKlarnaCustomerAddress', () => {
  it('prefers Klarna OM shipping address over sparse Express collection', () => {
    const resolved = resolveKlarnaCustomerAddress({
      collectedShippingAddress: {
        given_name: 'Sparse',
        country: 'NO'
      },
      shippingAddress: {
        given_name: 'Ada',
        family_name: 'Lovelace',
        email: 'ada@example.com',
        phone: '+4712345678',
        street_address: 'Storgata 1',
        postal_code: '0155',
        city: 'Oslo',
        country: 'NO'
      }
    })

    assert.equal(resolved.given_name, 'Ada')
    assert.equal(resolved.family_name, 'Lovelace')
    assert.equal(resolved.email, 'ada@example.com')
    assert.equal(resolved.phone, '+4712345678')
    assert.equal(resolved.street_address, 'Storgata 1')
  })

  it('fills missing OM fields from collected Express address', () => {
    const resolved = resolveKlarnaCustomerAddress({
      collectedShippingAddress: {
        email: 'fallback@example.com',
        phone: '+4798765432',
        city: 'Bergen'
      },
      shippingAddress: {
        given_name: 'Ola',
        family_name: 'Nordmann',
        street_address: 'Bryggen 2',
        postal_code: '5003',
        country: 'NO'
      }
    })

    assert.equal(resolved.email, 'fallback@example.com')
    assert.equal(resolved.phone, '+4798765432')
    assert.equal(resolved.city, 'Bergen')
    assert.equal(resolved.given_name, 'Ola')
  })

  it('throws when email is missing after merge', () => {
    assert.throws(
      () =>
        resolveKlarnaCustomerAddress({
          collectedShippingAddress: {
            given_name: 'NoEmail'
          },
          shippingAddress: {
            given_name: 'StillNoEmail',
            phone: '+4711111111'
          }
        }),
      /missing customer email/i
    )
  })
})
