import type { ShopifyProduct } from 'types/product'

const productImage = {
  id: 'gid://shopify/ProductImage/techdown',
  url: 'https://cdn.shopify.com/techdown.jpg',
  altText: 'Rå Shopify-alttekst',
  width: 1200,
  height: 1500
}

const sizes = [
  {
    name: 'Liten',
    id: '100',
    sku: 'TECHDOWN-HAVDYP-S',
    availableForSale: false,
    quantityAvailable: 0,
    barcode: null
  },
  {
    name: 'Middels',
    id: '101',
    sku: 'TECHDOWN-HAVDYP-M',
    availableForSale: true,
    quantityAvailable: 7,
    barcode: '4006381333931'
  },
  {
    name: 'Stor',
    id: '102',
    sku: 'TECHDOWN-HAVDYP-L',
    availableForSale: true,
    quantityAvailable: 4,
    barcode: null
  },
  {
    name: 'Større',
    id: '103',
    sku: 'TECHDOWN-HAVDYP-XL',
    availableForSale: false,
    quantityAvailable: 0,
    barcode: null
  }
] as const

export function createTechDownShopifyProductFixture(): ShopifyProduct {
  const variants = sizes.map(size => ({
    node: {
      id: `gid://shopify/ProductVariant/${size.id}`,
      title: `Rå fraktvariant ${size.id}`,
      barcode: size.barcode,
      availableForSale: size.availableForSale,
      currentlyNotInStock: !size.availableForSale,
      taxable: true,
      selectedOptions: [
        { name: 'Farge', value: 'Havdyp' },
        { name: 'Størrelse', value: size.name },
        { name: 'Kjønn', value: 'Unisex' }
      ],
      price: { amount: '1990.00', currencyCode: 'NOK' },
      image: {
        ...productImage,
        id: `gid://shopify/ProductImage/${size.id}`,
        url: `https://cdn.shopify.com/techdown-${size.id}.jpg`
      },
      compareAtPrice: null,
      metafield: null,
      sku: size.sku,
      variantProfile: null,
      variantProfileData: undefined,
      weight: 1.2,
      weightUnit: 'KILOGRAMS',
      quantityAvailable: size.quantityAvailable
    }
  }))

  return {
    id: 'gid://shopify/Product/techdown',
    title: 'Rå Shopify-tittel for transport',
    handle: 'utekos-techdown',
    productType: 'Rå Shopify-produkttype',
    totalInventory: 11,
    updatedAt: '2026-08-11T09:00:00.000Z',
    collections: {
      nodes: [
        {
          id: 'gid://shopify/Collection/utekos',
          title: 'Utekos',
          handle: 'utekos'
        }
      ]
    },
    compareAtPriceRange: {
      minVariantPrice: {
        amount: '1990.00',
        currencyCode: 'NOK'
      },
      maxVariantPrice: {
        amount: '1990.00',
        currencyCode: 'NOK'
      }
    },
    priceRange: {
      minVariantPrice: {
        amount: '1990.00',
        currencyCode: 'NOK'
      },
      maxVariantPrice: {
        amount: '1990.00',
        currencyCode: 'NOK'
      }
    },
    availableForSale: true,
    images: { edges: [] },
    options: [
      {
        name: 'Farge',
        optionValues: [{ name: 'Havdyp' }]
      },
      {
        name: 'Størrelse',
        optionValues: sizes.map(size => ({ name: size.name }))
      },
      {
        name: 'Kjønn',
        optionValues: [{ name: 'Unisex' }]
      }
    ],
    description: 'Rå Shopify-beskrivelse',
    featuredImage: productImage,
    vendor: 'Rå Shopify-leverandør',
    tags: ['techdown'],
    relatedProducts: [],
    seo: {
      title: 'Rå Shopify SEO-tittel',
      description: 'Rå Shopify SEO-beskrivelse'
    },
    variants: { edges: variants }
  } as unknown as ShopifyProduct
}
