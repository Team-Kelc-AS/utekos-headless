// Path: src/lib/shopify/syncSubscriberToShopify.ts

export async function syncSubscriberToShopify(email: string) {
  const mutation = `
    mutation customerCreate($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  const variables = {
    input: {
      email: email,
      emailMarketingConsent: {
        marketingState: 'SUBSCRIBED',
        marketingOptInLevel: 'SINGLE_OPT_IN',
        consentUpdatedAt: new Date().toISOString()
      }
    }
  }

  try {
    const response = await fetch(
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2026-04/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN!
        },
        body: JSON.stringify({ query: mutation, variables })
      }
    )

    const data = await response.json()
    if (data.errors || data.data?.customerCreate?.userErrors?.length > 0) {
      const err = data.data?.customerCreate?.userErrors[0]?.message
      if (err && !err.includes('taken')) {
        console.warn('Shopify Sync Warning:', err)
      }
    }
  } catch (e) {
    console.warn('Shopify Sync Failed (Non-critical):', e)
  }
}
