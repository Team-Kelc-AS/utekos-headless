import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readShopifyBuyerIdentities } from './readShopifyBuyerIdentities'

test('buyer reference includes address phones without double-counting customers', async () => {
  const result = await readShopifyBuyerIdentities(
    {
      STORE_DOMAIN: 'test.myshopify.com',
      SHOPIFY_ADMIN_API_TOKEN: 'test'
    },
    async () =>
      Response.json({
        data: {
          customers: {
            pageInfo: { hasNextPage: false, endCursor: null },
            nodes: [
              {
                id: 'gid://shopify/Customer/1',
                numberOfOrders: '1',
                defaultEmailAddress: {
                  emailAddress: 'buyer@example.com'
                },
                defaultPhoneNumber: {
                  phoneNumber: '+4740000001'
                },
                defaultAddress: { phone: '+4740000002' },
                amountSpent: {
                  amount: '2000',
                  currencyCode: 'NOK'
                },
                updatedAt: '2026-09-06T00:00:00Z'
              }
            ]
          }
        }
      })
  )
  assert.equal(result.buyerProfiles, 1)
  assert.equal(result.uniqueUsableBuyerPhones, 2)
  assert.equal(result.rows.length, 2)
})

test('partial Shopify response with errors is rejected, never treated as complete', async () => {
  await assert.rejects(
    readShopifyBuyerIdentities(
      {
        STORE_DOMAIN: 'test.myshopify.com',
        SHOPIFY_ADMIN_API_TOKEN: 'test'
      },
      async () =>
        Response.json({
          errors: [{ message: 'failed' }],
          data: {
            customers: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: []
            }
          }
        })
    ),
    /no partial/
  )
})
