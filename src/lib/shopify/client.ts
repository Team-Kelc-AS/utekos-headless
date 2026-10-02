import {createStorefrontClient} from '@shopify/hydrogen-react';

export const client = createStorefrontClient({
  storeDomain: process.env.PUBLIC_STORE_DOMAIN!,
  publicStorefrontToken: process.env.PUBLIC_STOREFRONT_API_TOKEN!,
});