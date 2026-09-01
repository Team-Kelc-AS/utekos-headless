// Path: types/commerce/customer/Customer.ts

import type { Address } from 'types/commerce/customer/Address'

export type Customer = {
  id: number
  created_at: string | null
  updated_at: string | null
  first_name: string | null
  last_name: string | null
  state: string
  note: string | null
  verified_email: boolean
  multipass_identifier: string | null
  tax_exempt: boolean
  email: string | null
  phone: string | null
  orders_count?: number
  currency: string
  tax_exemptions: string[]
  admin_graphql_api_id: string
  default_address: Address | null
}
