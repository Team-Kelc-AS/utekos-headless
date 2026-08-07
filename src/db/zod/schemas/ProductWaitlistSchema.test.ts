import assert from 'node:assert/strict'
import test from 'node:test'
import { ProductWaitlistSchema } from './ProductWaitlistSchema'

test('accepts a valid Utekos Dun waitlist submission', () => {
  const result = ProductWaitlistSchema.safeParse({
    name: 'Kari Nordmann',
    phone: '+47 123 45 678',
    email: 'kari@example.com',
    productHandle: 'utekos-dun',
    entryPoint: 'product_card',
    privacy: true,
    marketing: false,
    website: ''
  })

  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.entryPoint, 'product_card')
  }
})

test('defaults entryPoint to product_page when omitted', () => {
  const result = ProductWaitlistSchema.safeParse({
    name: 'Kari Nordmann',
    phone: '+47 123 45 678',
    email: 'kari@example.com',
    productHandle: 'utekos-dun',
    privacy: true,
    marketing: false,
    website: ''
  })

  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.entryPoint, 'product_page')
  }
})

test('accepts optional marketing consent when unchecked by omission', () => {
  const result = ProductWaitlistSchema.safeParse({
    name: 'Kari Nordmann',
    phone: '+47 123 45 678',
    email: 'kari@example.com',
    productHandle: 'utekos-dun',
    privacy: true,
    website: ''
  })

  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.marketing, false)
  }
})

test('requires privacy acknowledgement and the expected product handle', () => {
  const result = ProductWaitlistSchema.safeParse({
    name: 'Kari Nordmann',
    phone: '+47 123 45 678',
    email: 'kari@example.com',
    productHandle: 'another-product',
    privacy: false,
    marketing: true,
    website: ''
  })

  assert.equal(result.success, false)

  if (!result.success) {
    const paths = result.error.issues.map(issue => issue.path[0])
    assert.equal(paths.includes('productHandle'), true)
    assert.equal(paths.includes('privacy'), true)
  }
})
